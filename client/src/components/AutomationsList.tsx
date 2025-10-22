import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AutomationBuilder } from "./AutomationBuilder";
import { Zap, Plus, Trash2, Clock, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BoardAutomationRule } from "@shared/schema";

interface AutomationsListProps {
  boardId: string;
}

export function AutomationsList({ boardId }: AutomationsListProps) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery<BoardAutomationRule[]>({
    queryKey: ["/api/boards", boardId, "automations"],
    enabled: !!boardId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const response = await apiRequest("PATCH", `/api/automations/${id}`, { isEnabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "automations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update automation",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/automations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Automation deleted",
        description: "The automation rule has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "automations"] });
      setDeleteRuleId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete automation",
        variant: "destructive",
      });
    },
  });

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "on_field_change": return "When field changes";
      case "on_item_create": return "When item created";
      case "on_date_arrive": return "When date arrives";
      case "cron_schedule": return "On schedule";
      default: return type;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "notify_user": return "Notify user";
      case "set_field_value": return "Update field";
      case "create_item": return "Create item";
      case "send_email": return "Send email";
      case "call_webhook": return "Call webhook";
      default: return type;
    }
  };

  if (isBuilderOpen) {
    return (
      <div className="flex justify-center p-6">
        <AutomationBuilder
          boardId={boardId}
          onComplete={() => setIsBuilderOpen(false)}
          onCancel={() => setIsBuilderOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automations
          </h2>
          <p className="text-sm text-muted-foreground">
            Create rules to automate your workflow
          </p>
        </div>
        <Button
          onClick={() => setIsBuilderOpen(true)}
          data-testid="button-create-automation"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading automations...</p>
          </CardContent>
        </Card>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No automations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first automation to streamline your workflow
            </p>
            <Button onClick={() => setIsBuilderOpen(true)} data-testid="button-create-first">
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {automations.map((automation) => (
            <Card key={automation.id} data-testid={`automation-${automation.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{automation.name}</CardTitle>
                    {automation.description && (
                      <CardDescription>{automation.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={automation.isEnabled}
                      onCheckedChange={(checked) => {
                        toggleMutation.mutate({ id: automation.id, isEnabled: checked });
                      }}
                      data-testid={`switch-enabled-${automation.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteRuleId(automation.id)}
                      data-testid={`button-delete-${automation.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary" data-testid={`badge-trigger-${automation.id}`}>
                    <Clock className="h-3 w-3 mr-1" />
                    {getTriggerLabel(automation.triggerType)}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary" data-testid={`badge-action-${automation.id}`}>
                    <Zap className="h-3 w-3 mr-1" />
                    {getActionLabel(automation.actionType)}
                  </Badge>
                  {!automation.isEnabled && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Disabled
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteRuleId !== null} onOpenChange={(open) => !open && setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this automation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRuleId && deleteMutation.mutate(deleteRuleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
