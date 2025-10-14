import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Tasks() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const tasksByStatus = {
    todo: tasks?.filter((t: any) => t.status === "todo") || [],
    in_progress: tasks?.filter((t: any) => t.status === "in_progress") || [],
    review: tasks?.filter((t: any) => t.status === "review") || [],
    done: tasks?.filter((t: any) => t.status === "done") || [],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-status-proposal";
      case "in_progress": return "bg-status-viewed";
      case "review": return "bg-status-expired";
      case "done": return "bg-status-completed";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-status-canceled";
      case "medium": return "text-status-expired";
      case "low": return "text-status-proposal";
      default: return "text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-tasks-title">Tasks</h1>
          <p className="text-muted-foreground">Manage your workflow with Kanban board</p>
        </div>
        <Button data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks?.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="text-sm text-muted-foreground">Create your first task to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold capitalize">{status.replace("_", " ")}</h3>
                <Badge variant="secondary">{statusTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {statusTasks.length === 0 ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="py-8">
                      <p className="text-sm text-muted-foreground text-center">No tasks</p>
                    </CardContent>
                  </Card>
                ) : (
                  statusTasks.map((task: any) => (
                    <Card key={task.id} className="rounded-2xl hover-elevate cursor-move" data-testid={`card-task-${task.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm" data-testid={`text-task-title-${task.id}`}>{task.title}</CardTitle>
                          <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      {task.description && (
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
