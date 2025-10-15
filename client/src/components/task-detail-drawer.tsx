import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Paperclip,
  CheckSquare,
  Calendar,
  User,
  Clock,
  Send,
  Trash2,
  Edit,
  Plus,
  X
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, TaskComment, TaskAttachment, Subtask, TaskActivity } from "@shared/schema";

interface TaskDetailDrawerProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

const subtaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export function TaskDetailDrawer({ taskId, open, onOpenChange }: TaskDetailDrawerProps) {
  const { toast } = useToast();
  const [editingComment, setEditingComment] = useState<string | null>(null);

  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId && open,
  });

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
    enabled: !!taskId && open,
  });

  const { data: attachments = [] } = useQuery<TaskAttachment[]>({
    queryKey: ["/api/tasks", taskId, "attachments"],
    enabled: !!taskId && open,
  });

  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: ["/api/tasks", taskId, "subtasks"],
    enabled: !!taskId && open,
  });

  const { data: activity = [] } = useQuery<TaskActivity[]>({
    queryKey: ["/api/tasks", taskId, "activity"],
    enabled: !!taskId && open,
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const subtaskForm = useForm<z.infer<typeof subtaskSchema>>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: { title: "" },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string }) =>
      apiRequest("POST", `/api/tasks/${taskId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "activity"] });
      commentForm.reset();
      toast({ title: "Comment added" });
    },
    onError: () => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiRequest("DELETE", `/api/tasks/${taskId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (data: { title: string }) => {
      const maxIndex = Math.max(...subtasks.map(s => s.sortIndex || 0), -1);
      return apiRequest("POST", `/api/tasks/${taskId}/subtasks`, { ...data, sortIndex: maxIndex + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "subtasks"] });
      subtaskForm.reset();
      toast({ title: "Subtask added" });
    },
    onError: () => {
      toast({ title: "Failed to add subtask", variant: "destructive" });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      apiRequest("PATCH", `/api/tasks/${taskId}/subtasks/${id}`, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "subtasks"] });
    },
    onError: () => {
      toast({ title: "Failed to update subtask", variant: "destructive" });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) =>
      apiRequest("DELETE", `/api/tasks/${taskId}/subtasks/${subtaskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "subtasks"] });
      toast({ title: "Subtask deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete subtask", variant: "destructive" });
    },
  });

  const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  if (!taskId) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>{task?.title || "Loading..."}</DrawerTitle>
          <DrawerDescription>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={task?.priority === "urgent" ? "destructive" : "secondary"}>
                {task?.priority}
              </Badge>
              <Badge variant="outline">{task?.status}</Badge>
              {task?.dueAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueAt), "MMM d, yyyy")}
                </div>
              )}
            </div>
          </DrawerDescription>
        </DrawerHeader>

        <Tabs defaultValue="description" className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="subtasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Subtasks ({completedSubtasks}/{totalSubtasks})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="flex-1 px-6">
            <ScrollArea className="h-[calc(85vh-200px)]">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task?.description || "No description"}
                </p>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 px-6 flex flex-col">
            <ScrollArea className="flex-1 mb-4 h-[calc(85vh-300px)]">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">User</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 mt-1"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        data-testid={`button-delete-comment-${comment.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <form
              onSubmit={commentForm.handleSubmit((data) => createCommentMutation.mutate(data))}
              className="flex gap-2"
              data-testid="form-add-comment"
            >
              <Textarea
                {...commentForm.register("content")}
                placeholder="Add a comment..."
                className="resize-none"
                rows={2}
                data-testid="input-comment"
              />
              <Button type="submit" size="icon" disabled={createCommentMutation.isPending} data-testid="button-send-comment">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="subtasks" className="flex-1 px-6 flex flex-col">
            <ScrollArea className="flex-1 mb-4 h-[calc(85vh-300px)]">
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 group"
                    data-testid={`subtask-${subtask.id}`}
                  >
                    <Checkbox
                      checked={subtask.isCompleted}
                      onCheckedChange={(checked) =>
                        toggleSubtaskMutation.mutate({ id: subtask.id, isCompleted: !!checked })
                      }
                      data-testid={`checkbox-subtask-${subtask.id}`}
                    />
                    <span
                      className={`flex-1 text-sm ${
                        subtask.isCompleted ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                      data-testid={`button-delete-subtask-${subtask.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <form
              onSubmit={subtaskForm.handleSubmit((data) => createSubtaskMutation.mutate(data))}
              className="flex gap-2"
              data-testid="form-add-subtask"
            >
              <Input
                {...subtaskForm.register("title")}
                placeholder="Add a subtask..."
                data-testid="input-subtask"
              />
              <Button type="submit" size="icon" disabled={createSubtaskMutation.isPending} data-testid="button-add-subtask">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 px-6">
            <ScrollArea className="h-[calc(85vh-200px)]">
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-3" data-testid={`activity-${item.id}`}>
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="w-px bg-border flex-1 my-1" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      {item.details && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}
