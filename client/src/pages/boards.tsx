import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Calendar, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBoardSchema, type InsertBoard } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function Boards() {
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: boards, isLoading } = useQuery({
    queryKey: ["/api/boards"],
  });

  const form = useForm<InsertBoard>({
    resolver: zodResolver(insertBoardSchema.omit({ ownerId: true })),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createBoardMutation = useMutation({
    mutationFn: async (data: InsertBoard) => {
      return apiRequest("POST", "/api/boards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards"] });
      toast({
        title: "Board created",
        description: "Your new board has been created successfully",
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create board",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBoard) => {
    createBoardMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-boards-title">Project Boards</h1>
          <p className="text-muted-foreground">Manage your projects with Kanban boards</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-board">
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Q1 Projects" 
                          data-testid="input-board-name"
                        />
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
                          placeholder="Brief description of this board..."
                          data-testid="input-board-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createBoardMutation.isPending}
                  data-testid="button-submit-board"
                >
                  {createBoardMutation.isPending ? "Creating..." : "Create Board"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!boards || (boards as any[]).length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No boards yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create your first project board to get started</p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-board">
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(boards as any[]).map((board: any) => (
            <Card 
              key={board.id} 
              className="rounded-2xl hover-elevate active-elevate-2 cursor-pointer transition-all" 
              onClick={() => setLocation(`/boards/${board.id}`)}
              data-testid={`card-board-${board.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1" data-testid={`text-board-name-${board.id}`}>
                      {board.name}
                    </CardTitle>
                    {board.description && (
                      <CardDescription className="text-sm line-clamp-2" data-testid={`text-board-description-${board.id}`}>
                        {board.description}
                      </CardDescription>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span data-testid={`text-board-created-${board.id}`}>
                      {format(new Date(board.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
