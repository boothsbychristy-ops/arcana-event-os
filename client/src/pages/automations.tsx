import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Zap, Play, Trash2, History, Power } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const automationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  triggerEvent: z.string().min(1, "Trigger event is required"),
  conditions: z.string().optional(),
  actionType: z.string().min(1, "Action type is required"),
  actionConfig: z.string().min(1, "Action configuration is required"),
  runScope: z.string().default("immediate"),
});

type AutomationFormValues = z.infer<typeof automationFormSchema>;

const triggerEvents = [
  { value: "task.created", label: "Task Created" },
  { value: "task.status_changed", label: "Task Status Changed" },
  { value: "task.assigned", label: "Task Assigned" },
  { value: "task.overdue", label: "Task Overdue" },
];

const actionTypes = [
  { value: "send_notification", label: "Send Notification" },
  { value: "update_status", label: "Update Status" },
  { value: "create_subtasks", label: "Create Subtasks" },
];

export default function AutomationsPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [logsSheetOpen, setLogsSheetOpen] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | undefined>();

  const { data: automations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/automations"],
  });

  const { data: logs } = useQuery<any[]>({
    queryKey: ["/api/automations/logs", selectedAutomationId],
    enabled: logsSheetOpen,
  });

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      triggerEvent: "",
      conditions: "{}",
      actionType: "",
      actionConfig: "{}",
      runScope: "immediate",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AutomationFormValues) => {
      return apiRequest("POST", "/api/automations", {
        ...data,
        conditions: JSON.parse(data.conditions || "{}"),
        actionConfig: JSON.parse(data.actionConfig || "{}"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({ title: "Automation created successfully" });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create automation", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/automations/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({ title: "Automation toggled successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/automations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({ title: "Automation deleted successfully" });
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/automations/${id}/run`, { payload: {} }),
    onSuccess: () => {
      toast({ title: "Automation run successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/automations/logs"] });
    },
    onError: () => {
      toast({ title: "Failed to run automation", variant: "destructive" });
    },
  });

  const onSubmit = (data: AutomationFormValues) => {
    createMutation.mutate(data);
  };

  const openLogs = (automationId?: string) => {
    setSelectedAutomationId(automationId);
    setLogsSheetOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automate your workflow with "When X → Do Y" logic
          </p>
        </div>
        <div className="flex gap-2">
          <Sheet open={logsSheetOpen} onOpenChange={setLogsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" data-testid="button-view-logs">
                <History className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[600px] sm:max-w-[600px]">
              <SheetHeader>
                <SheetTitle>Automation Logs</SheetTitle>
                <SheetDescription>
                  Recent automation execution history
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {logs?.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg space-y-2"
                    data-testid={`log-${log.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{log.automationName}</span>
                      <Badge
                        variant={log.success ? "default" : "destructive"}
                        data-testid={`badge-status-${log.id}`}
                      >
                        {log.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.executedAt), {
                        addSuffix: true,
                      })}
                    </p>
                    {log.error && (
                      <p className="text-sm text-destructive">{log.error}</p>
                    )}
                  </div>
                ))}
                {!logs?.length && (
                  <p className="text-center text-muted-foreground py-8">
                    No logs available
                  </p>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-automation">
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation</DialogTitle>
                <DialogDescription>
                  Set up a new automation to streamline your workflow
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Notify on task creation"
                            data-testid="input-automation-name"
                            {...field}
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
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description"
                            data-testid="input-automation-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="triggerEvent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>When (Trigger)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-trigger-event">
                              <SelectValue placeholder="Select trigger event" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {triggerEvents.map((event) => (
                              <SelectItem key={event.value} value={event.value}>
                                {event.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Do (Action)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-action-type">
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {actionTypes.map((action) => (
                              <SelectItem key={action.value} value={action.value}>
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actionConfig"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Configuration (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"message": "Task created!", "userId": "..."}'
                            data-testid="input-action-config"
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-automation"
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading automations...</p>
          </div>
        ) : !automations?.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Zap className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold">No automations yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first automation to get started
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation: any) => (
                <TableRow key={automation.id} data-testid={`row-automation-${automation.id}`}>
                  <TableCell className="font-medium">{automation.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" data-testid={`badge-trigger-${automation.id}`}>
                      {automation.triggerEvent}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-action-${automation.id}`}>
                      {automation.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation.isEnabled}
                        onCheckedChange={() => toggleMutation.mutate(automation.id)}
                        data-testid={`switch-enable-${automation.id}`}
                      />
                      <span className="text-sm">
                        {automation.isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {automation.lastRunAt
                      ? formatDistanceToNow(new Date(automation.lastRunAt), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => runMutation.mutate(automation.id)}
                        disabled={runMutation.isPending}
                        data-testid={`button-run-${automation.id}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(automation.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${automation.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
