import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Settings2, MoreVertical, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBoardGroupSchema, insertTaskSchema, insertTaskStatusSchema, type InsertBoardGroup, type InsertTask, type InsertTaskStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskDetailDrawer } from "@/components/task-detail-drawer";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Task Card Component
function TaskCard({ task, isDragging, onClick }: { task: any; isDragging?: boolean; onClick?: () => void }) {
  const statusColor = task.statusId ? "bg-primary/20 text-primary" : "bg-muted";
  
  return (
    <Card 
      className={`rounded-xl ${isDragging ? "opacity-50" : "hover-elevate"} cursor-pointer`}
      onClick={onClick}
      data-testid={`card-task-${task.id}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm" data-testid={`text-task-title-${task.id}`}>
          {task.title}
        </CardTitle>
      </CardHeader>
      {task.description && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        </CardContent>
      )}
    </Card>
  );
}

// Sortable Task Card
function SortableTaskCard({ task, onTaskClick }: { task: any; onTaskClick: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} onClick={() => onTaskClick(task.id)} />
    </div>
  );
}

// Group Column Component
function GroupColumn({ group, tasks, statuses, onTaskClick }: { group: any; tasks: any[]; statuses: any[]; onTaskClick: (taskId: string) => void }) {
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema.omit({ boardId: true, groupId: true, ownerId: true, sortIndex: true })),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const maxIndex = Math.max(...tasks.map(t => t.sortIndex || 0), -1);
      return apiRequest("POST", "/api/tasks", {
        ...data,
        boardId: group.boardId,
        groupId: group.id,
        sortIndex: maxIndex + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", group.boardId] });
      toast({ title: "Task created" });
      form.reset();
      setAddTaskOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    },
  });

  const taskIds = tasks.map(t => t.id);

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="rounded-2xl h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex-1">
            <CardTitle className="text-base" data-testid={`text-group-name-${group.id}`}>
              {group.title}
            </CardTitle>
            <Badge variant="secondary" className="mt-1">{tasks.length}</Badge>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-y-auto">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </SortableContext>
          
          <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                data-testid={`button-add-task-${group.id}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Task to {group.title}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data: InsertTask) => createTaskMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Task title" data-testid="input-task-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ""}
                            placeholder="Task description..."
                            data-testid="input-task-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-task-due-date"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BoardView() {
  const [, params] = useRoute("/boards/:id");
  const [, setLocation] = useLocation();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const { toast } = useToast();

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDrawerOpen(true);
  };

  const { data: boardData, isLoading } = useQuery({
    queryKey: ["/api/boards", params?.id],
    enabled: !!params?.id,
  });

  const groupForm = useForm<InsertBoardGroup>({
    resolver: zodResolver(insertBoardGroupSchema.omit({ boardId: true, sortIndex: true })),
    defaultValues: {
      title: "",
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: InsertBoardGroup) => {
      const groups = (boardData as any)?.groups || [];
      const maxIndex = Math.max(...groups.map((g: any) => g.sortIndex || 0), -1);
      return apiRequest("POST", `/api/boards/${params?.id}/groups`, { 
        ...data, 
        sortIndex: maxIndex + 1 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", params?.id] });
      toast({ title: "Group created" });
      groupForm.reset();
      setAddGroupOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create group", variant: "destructive" });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, toGroupId, toIndex }: { taskId: string; toGroupId: string; toIndex: number }) => {
      return apiRequest("POST", `/api/tasks/${taskId}/move`, { 
        toGroupId, 
        toIndex 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", params?.id] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = active.data.current?.task;
    const overTask = over.data.current?.task;

    if (!activeTask) return;

    // Determine target group
    let targetGroupId = activeTask.groupId;
    let targetIndex = activeTask.sortIndex;

    if (overTask) {
      targetGroupId = overTask.groupId;
      targetIndex = overTask.sortIndex;
    }

    // If moved to different position, update
    if (activeTask.id !== over.id || activeTask.groupId !== targetGroupId) {
      moveTaskMutation.mutate({
        taskId: activeTask.id,
        toGroupId: targetGroupId,
        toIndex: targetIndex,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-6 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-80 h-96 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Board not found</p>
      </div>
    );
  }

  const { board, groups = [], tasks = [], statuses = [] } = boardData as any;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/boards")}
            data-testid="button-back-to-boards"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-board-name">{board?.name}</h1>
            {board?.description && (
              <p className="text-muted-foreground" data-testid="text-board-description">{board.description}</p>
            )}
          </div>
        </div>
        <Button variant="outline" data-testid="button-board-settings">
          <Settings2 className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {groups.map((group: any) => {
            const groupTasks = tasks.filter((t: any) => t.groupId === group.id);
            return (
              <GroupColumn 
                key={group.id} 
                group={group} 
                tasks={groupTasks} 
                statuses={statuses}
                onTaskClick={handleTaskClick}
              />
            );
          })}
          
          <div className="flex-shrink-0 w-80">
            <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
              <DialogTrigger asChild>
                <Card className="rounded-2xl hover-elevate active-elevate-2 cursor-pointer border-dashed h-full min-h-[200px]">
                  <CardContent className="flex flex-col items-center justify-center h-full">
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Add Group</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Group</DialogTitle>
                </DialogHeader>
                <Form {...groupForm}>
                  <form onSubmit={groupForm.handleSubmit((data: InsertBoardGroup) => createGroupMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={groupForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., To Do, In Progress" data-testid="input-group-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createGroupMutation.isPending}>
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailDrawer 
        taskId={selectedTaskId}
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
      />
    </div>
  );
}
