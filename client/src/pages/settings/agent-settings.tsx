import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Plus, Settings, Trash2, AlertCircle, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AgentRule } from "@shared/schema";

const agentRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  triggerType: z.enum(["task_overdue", "booking_upcoming", "invoice_unpaid", "proposal_pending", "staff_idle", "client_unresponsive"]),
  triggerCondition: z.string().min(1, "Trigger condition is required"),
  delayMinutes: z.coerce.number().min(0, "Delay must be 0 or greater"),
  action: z.enum(["send_notification", "send_email", "create_task", "escalate", "update_status"]),
  actionData: z.string().min(1, "Action data is required"),
  deliveryChannel: z.enum(["in_app", "email", "both"]),
  tone: z.enum(["friendly", "professional", "urgent", "casual"]).optional(),
  agentPersona: z.string().optional(),
});

type AgentRuleFormData = z.infer<typeof agentRuleSchema>;

export default function AgentSettings() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AgentRule | null>(null);

  const { data: rules, isLoading } = useQuery<AgentRule[]>({
    queryKey: ["/api/agent-rules"],
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: AgentRuleFormData) => {
      return apiRequest("/api/agent-rules", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-rules"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Agent rule created",
        description: "The smart agent rule has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create agent rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AgentRuleFormData> }) => {
      return apiRequest(`/api/agent-rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-rules"] });
      setEditingRule(null);
      toast({
        title: "Agent rule updated",
        description: "The smart agent rule has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update agent rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/agent-rules/${id}/toggle`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-rules"] });
      toast({
        title: "Agent rule toggled",
        description: "The agent rule status has been updated.",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/agent-rules/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-rules"] });
      toast({
        title: "Agent rule deleted",
        description: "The agent rule has been deleted successfully.",
      });
    },
  });

  const form = useForm<AgentRuleFormData>({
    resolver: zodResolver(agentRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      triggerType: "task_overdue",
      triggerCondition: "",
      delayMinutes: 0,
      action: "send_notification",
      actionData: "",
      deliveryChannel: "in_app",
      tone: "professional",
      agentPersona: "",
    },
  });

  const onSubmit = (data: AgentRuleFormData) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task_overdue: "Task Overdue",
      booking_upcoming: "Booking Upcoming",
      invoice_unpaid: "Invoice Unpaid",
      proposal_pending: "Proposal Pending",
      staff_idle: "Staff Idle",
      client_unresponsive: "Client Unresponsive",
    };
    return labels[type] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      send_notification: "Send Notification",
      send_email: "Send Email",
      create_task: "Create Task",
      escalate: "Escalate",
      update_status: "Update Status",
    };
    return labels[action] || action;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Agents & Follow-Up</h1>
          <p className="text-muted-foreground mt-2">
            Configure intelligent agents to monitor, nudge, and escalate automatically
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-agent-rule">
              <Plus className="h-4 w-4 mr-2" />
              New Agent Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Agent Rule</DialogTitle>
              <DialogDescription>
                Set up an intelligent agent to monitor conditions and take actions automatically
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Overdue Task Reminder" {...field} data-testid="input-rule-name" />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe what this rule does" {...field} data-testid="input-rule-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="triggerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trigger Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-trigger-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="task_overdue">Task Overdue</SelectItem>
                            <SelectItem value="booking_upcoming">Booking Upcoming</SelectItem>
                            <SelectItem value="invoice_unpaid">Invoice Unpaid</SelectItem>
                            <SelectItem value="proposal_pending">Proposal Pending</SelectItem>
                            <SelectItem value="staff_idle">Staff Idle</SelectItem>
                            <SelectItem value="client_unresponsive">Client Unresponsive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delayMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delay (Minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} data-testid="input-delay-minutes" />
                        </FormControl>
                        <FormDescription>
                          How long to wait before triggering
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="triggerCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Condition</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="E.g., status = 'pending' AND days_overdue > 2" 
                          {...field} 
                          data-testid="input-trigger-condition"
                        />
                      </FormControl>
                      <FormDescription>
                        Condition expression (JSON format supported)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-action">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="send_notification">Send Notification</SelectItem>
                            <SelectItem value="send_email">Send Email</SelectItem>
                            <SelectItem value="create_task">Create Task</SelectItem>
                            <SelectItem value="escalate">Escalate</SelectItem>
                            <SelectItem value="update_status">Update Status</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryChannel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Channel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-delivery-channel">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_app">In-App Only</SelectItem>
                            <SelectItem value="email">Email Only</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="actionData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Data</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='E.g., {"message": "Your task is overdue", "priority": "high"}' 
                          {...field} 
                          data-testid="input-action-data"
                        />
                      </FormControl>
                      <FormDescription>
                        JSON configuration for the action
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tone">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agentPersona"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Persona (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Project Manager, Accountant" {...field} data-testid="input-agent-persona" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                    data-testid="button-submit-agent-rule"
                  >
                    {editingRule ? "Update Rule" : "Create Rule"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading agent rules...</div>
        </div>
      ) : rules && rules.length > 0 ? (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} data-testid={`card-agent-rule-${rule.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{rule.name}</CardTitle>
                      <Badge variant={rule.active ? "default" : "secondary"} data-testid={`badge-rule-status-${rule.id}`}>
                        {rule.active ? "Active" : "Inactive"}
                      </Badge>
                      {rule.tone && (
                        <Badge variant="outline" data-testid={`badge-rule-tone-${rule.id}`}>
                          {rule.tone}
                        </Badge>
                      )}
                    </div>
                    {rule.description && (
                      <CardDescription className="mt-2">{rule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.active}
                      onCheckedChange={() => toggleRuleMutation.mutate(rule.id)}
                      data-testid={`switch-toggle-rule-${rule.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                      data-testid={`button-delete-rule-${rule.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Trigger</div>
                    <div className="flex items-center gap-2 mt-1">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium">{getTriggerTypeLabel(rule.triggerType)}</span>
                    </div>
                    {rule.delayMinutes > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Delay: {rule.delayMinutes} minutes
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Action</div>
                    <div className="flex items-center gap-2 mt-1">
                      {rule.deliveryChannel === "email" || rule.deliveryChannel === "both" ? (
                        <Mail className="h-4 w-4 text-primary" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{getActionLabel(rule.action)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      via {rule.deliveryChannel === "both" ? "In-App & Email" : rule.deliveryChannel === "email" ? "Email" : "In-App"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Condition</div>
                  <div className="text-sm bg-muted p-2 rounded-md mt-1 font-mono">
                    {rule.triggerCondition}
                  </div>
                </div>

                {rule.agentPersona && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Agent Persona</div>
                    <div className="text-sm mt-1">{rule.agentPersona}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agent rules configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first smart agent rule to start automating follow-ups and nudges
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-rule">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
