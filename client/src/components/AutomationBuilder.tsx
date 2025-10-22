import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Zap } from "lucide-react";
import type { DynamicField } from "@shared/schema";

const automationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  triggerType: z.enum(["on_field_change", "on_item_create", "on_date_arrive", "cron_schedule"]),
  triggerConfig: z.record(z.any()),
  actionType: z.enum(["notify_user", "set_field_value", "create_item", "send_email", "call_webhook"]),
  actionConfig: z.record(z.any()),
  isEnabled: z.boolean().default(true),
});

type AutomationFormData = z.infer<typeof automationSchema>;

interface AutomationBuilderProps {
  boardId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function AutomationBuilder({ boardId, onComplete, onCancel }: AutomationBuilderProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      name: "",
      description: "",
      triggerType: "on_field_change",
      triggerConfig: {},
      actionType: "notify_user",
      actionConfig: {},
      isEnabled: true,
    },
  });

  // Fetch board fields for configuration
  const { data: fields = [] } = useQuery<DynamicField[]>({
    queryKey: ["/api/boards/dynamic", boardId, "fields"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: AutomationFormData) => {
      const response = await apiRequest("POST", `/api/boards/${boardId}/automations`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Automation created",
        description: "Your automation rule has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "automations"] });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create automation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AutomationFormData) => {
    createMutation.mutate(data);
  };

  const triggerType = form.watch("triggerType");
  const actionType = form.watch("actionType");

  const nextStep = async () => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = await form.trigger(["name", "description"]);
        break;
      case 2:
        isValid = await form.trigger(["triggerType"]);
        break;
      case 3:
        // Validate trigger config
        isValid = true;
        break;
      case 4:
        isValid = await form.trigger(["actionType"]);
        break;
      case 5:
        // Validate action config
        isValid = true;
        break;
    }
    
    if (isValid && step < 5) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Create Automation
        </CardTitle>
        <CardDescription>
          Step {step} of 5: {
            step === 1 ? "Basic Information" :
            step === 2 ? "Select Trigger" :
            step === 3 ? "Configure Trigger" :
            step === 4 ? "Select Action" :
            "Configure Action"
          }
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Automation Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-automation-name"
                          placeholder="e.g., Notify when status changes"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Give your automation a descriptive name
                      </FormDescription>
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
                          data-testid="input-automation-description"
                          placeholder="Describe what this automation does"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 2: Select Trigger */}
            {step === 2 && (
              <FormField
                control={form.control}
                name="triggerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When should this automation run?</FormLabel>
                    <Select
                      data-testid="select-trigger-type"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trigger" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="on_field_change">When a field changes</SelectItem>
                        <SelectItem value="on_item_create">When an item is created</SelectItem>
                        <SelectItem value="on_date_arrive">When a date arrives</SelectItem>
                        <SelectItem value="cron_schedule">On a schedule (cron)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose what event will trigger this automation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Step 3: Configure Trigger */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configure Trigger</h3>

                {triggerType === "on_field_change" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Field</label>
                      <Select
                        data-testid="select-trigger-field"
                        onValueChange={(value) => {
                          const config = form.getValues("triggerConfig");
                          form.setValue("triggerConfig", { ...config, fieldId: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Operator</label>
                      <Select
                        data-testid="select-trigger-operator"
                        onValueChange={(value) => {
                          const config = form.getValues("triggerConfig");
                          form.setValue("triggerConfig", { ...config, operator: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="=">Equals</SelectItem>
                          <SelectItem value="!=">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="not_contains">Does Not Contain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Value</label>
                      <Input
                        data-testid="input-trigger-value"
                        placeholder="Enter value to match"
                        onChange={(e) => {
                          const config = form.getValues("triggerConfig");
                          form.setValue("triggerConfig", { ...config, value: e.target.value });
                        }}
                      />
                    </div>
                  </>
                )}

                {triggerType === "on_item_create" && (
                  <p className="text-sm text-muted-foreground">
                    This automation will run whenever a new item is created on this board.
                  </p>
                )}

                {triggerType === "on_date_arrive" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date Field</label>
                      <Select
                        data-testid="select-date-field"
                        onValueChange={(value) => {
                          const config = form.getValues("triggerConfig");
                          form.setValue("triggerConfig", { ...config, fieldId: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a date field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.filter(f => f.type === "date").map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Days Offset</label>
                      <Input
                        data-testid="input-offset-days"
                        type="number"
                        placeholder="0"
                        onChange={(e) => {
                          const config = form.getValues("triggerConfig");
                          form.setValue("triggerConfig", { ...config, offsetDays: parseInt(e.target.value) || 0 });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use negative numbers for days before, positive for days after
                      </p>
                    </div>
                  </>
                )}

                {triggerType === "cron_schedule" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cron Expression</label>
                    <Input
                      data-testid="input-cron-expression"
                      placeholder="0 9 * * 1 (Every Monday at 9 AM)"
                      onChange={(e) => {
                        const config = form.getValues("triggerConfig");
                        form.setValue("triggerConfig", { ...config, cron: e.target.value });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: minute hour day month dayOfWeek
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Select Action */}
            {step === 4 && (
              <FormField
                control={form.control}
                name="actionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What should happen?</FormLabel>
                    <Select
                      data-testid="select-action-type"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="notify_user">Notify a user</SelectItem>
                        <SelectItem value="set_field_value">Update a field</SelectItem>
                        <SelectItem value="create_item">Create new item</SelectItem>
                        <SelectItem value="send_email">Send email</SelectItem>
                        <SelectItem value="call_webhook">Call webhook</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose what action to perform when triggered
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Step 5: Configure Action */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configure Action</h3>

                {actionType === "notify_user" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">User ID</label>
                      <Input
                        data-testid="input-user-id"
                        placeholder="Enter user ID to notify"
                        onChange={(e) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, userId: e.target.value });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        data-testid="input-notification-message"
                        placeholder="Enter notification message"
                        onChange={(e) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, message: e.target.value });
                        }}
                      />
                    </div>
                  </>
                )}

                {actionType === "set_field_value" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Field</label>
                      <Select
                        data-testid="select-action-field"
                        onValueChange={(value) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, fieldId: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field to update" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Value</label>
                      <Input
                        data-testid="input-action-value"
                        placeholder="Enter new value"
                        onChange={(e) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, value: e.target.value });
                        }}
                      />
                    </div>
                  </>
                )}

                {actionType === "create_item" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Name</label>
                    <Input
                      data-testid="input-item-name"
                      placeholder="Enter name for new item"
                      onChange={(e) => {
                        const config = form.getValues("actionConfig");
                        form.setValue("actionConfig", { ...config, itemName: e.target.value });
                      }}
                    />
                  </div>
                )}

                {actionType === "send_email" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        data-testid="input-email"
                        type="email"
                        placeholder="recipient@example.com"
                        onChange={(e) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, email: e.target.value });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        data-testid="input-email-subject"
                        placeholder="Email subject"
                        onChange={(e) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, subject: e.target.value });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Body</label>
                      <Textarea
                        data-testid="input-email-body"
                        placeholder="Email body"
                        onChange={(e) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, body: e.target.value });
                        }}
                      />
                    </div>
                  </>
                )}

                {actionType === "call_webhook" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Webhook URL</label>
                      <Input
                        data-testid="input-webhook-url"
                        type="url"
                        placeholder="https://example.com/webhook"
                        onChange={(e) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, url: e.target.value });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Method</label>
                      <Select
                        data-testid="select-webhook-method"
                        onValueChange={(value) => {
                          const config = form.getValues("actionConfig");
                          form.setValue("actionConfig", { ...config, method: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="POST" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between gap-2">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  data-testid="button-previous"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-create"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? "Creating..." : "Create Automation"}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
