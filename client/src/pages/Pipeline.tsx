import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import type { Event as EventType, Client, Project } from "@/../../shared/schema";

const eventSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Event title is required"),
  eventDate: z.string().min(1, "Event date is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
  stage: z.enum(["lead", "proposal", "contracted", "planning", "completed", "cancelled"]).default("lead"),
  budget: z.string().optional()
});

const projectSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  name: z.string().min(1, "Project name is required"),
  type: z.string().min(1, "Project type is required"),
  status: z.enum(["pending", "in_progress", "waiting_approval", "approved", "delivered"]).default("in_progress"),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional()
});

type EventFormData = z.infer<typeof eventSchema>;
type ProjectFormData = z.infer<typeof projectSchema>;

const PIPELINE_STAGES = [
  { 
    id: "lead", 
    label: "Leads", 
    color: "bg-slate-500",
    icon: Sparkles,
    description: "New opportunities"
  },
  { 
    id: "proposal", 
    label: "Proposals", 
    color: "bg-blue-500",
    icon: Zap,
    description: "Quotes sent"
  },
  { 
    id: "contracted", 
    label: "Contracted", 
    color: "bg-green-500",
    icon: Target,
    description: "Deals closed"
  },
  { 
    id: "planning", 
    label: "Planning", 
    color: "bg-yellow-500",
    icon: TrendingUp,
    description: "In production"
  },
  { 
    id: "completed", 
    label: "Completed", 
    color: "bg-purple-500",
    icon: Sparkles,
    description: "Delivered"
  }
];

export default function Pipeline() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({ 
    queryKey: ["/api/clients"] 
  });

  const { data: events = [] } = useQuery<EventType[]>({ 
    queryKey: ["/api/events"],
  });

  const { data: projects = [] } = useQuery<Project[]>({ 
    queryKey: ["/api/projects"],
  });

  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      stage: "lead",
      clientId: "",
      title: "",
      eventDate: "",
      location: "",
      notes: ""
    }
  });

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      eventId: "",
      name: "",
      type: "",
      status: "in_progress"
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Success", description: "Event created successfully" });
      setIsEventDialogOpen(false);
      eventForm.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create event", 
        variant: "destructive" 
      });
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Success", description: "Project created successfully" });
      setIsProjectDialogOpen(false);
      projectForm.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create project", 
        variant: "destructive" 
      });
    }
  });

  const updateEventStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to update event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Success", description: "Event stage updated" });
    }
  });

  const filteredEvents = selectedClient 
    ? events.filter(event => event.clientId === selectedClient)
    : events;

  const getEventsByStage = (stage: string) => {
    return filteredEvents.filter(event => event.stage === stage);
  };

  const getProjectsForEvent = (eventId: string) => {
    return projects.filter(project => project.eventId === eventId);
  };

  const getClient = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getProjectStatusColor = (status?: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "in_progress": return "bg-blue-500";
      case "waiting_approval": return "bg-yellow-500";
      case "approved": return "bg-green-500";
      case "delivered": return "bg-purple-500";
      default: return "secondary";
    }
  };

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("eventId", eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    if (eventId) {
      updateEventStage.mutate({ id: eventId, stage: newStage });
    }
  };

  return (
    <div className="h-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Client Pipeline</h1>
          <p className="text-muted-foreground">Track your events from lead to completion</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedClient || ""} onValueChange={(value) => setSelectedClient(value || null)}>
            <SelectTrigger className="w-[200px]" data-testid="select-client-filter">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button className="neon-glow" data-testid="button-add-event">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <Form {...eventForm}>
                <form onSubmit={eventForm.handleSubmit((data) => createEventMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={eventForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-event-client">
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Annual Gala 2024" data-testid="input-event-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City Convention Center" data-testid="input-event-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-event-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Event details..." data-testid="textarea-event-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Stage</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-event-stage">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PIPELINE_STAGES.filter(s => s.id !== "completed").map(stage => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eventForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="text" 
                            placeholder="10000" 
                            data-testid="input-event-budget"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createEventMutation.isPending} data-testid="button-submit-event">
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="flex gap-4 pb-4">
          {PIPELINE_STAGES.map(stage => {
            const Icon = stage.icon;
            const stageEvents = getEventsByStage(stage.id);
            
            return (
              <div 
                key={stage.id} 
                className="flex-1 min-w-[300px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="mb-4 glass-card rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{stage.label}</h3>
                    </div>
                    <Badge className={`${stage.color} text-white`}>
                      {stageEvents.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </div>

                <div className="space-y-3">
                  {stageEvents.map(event => {
                    const client = getClient(event.clientId);
                    const eventProjects = getProjectsForEvent(event.id);
                    
                    return (
                      <Card 
                        key={event.id}
                        className="cursor-move hover-elevate glass-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, event.id)}
                        data-testid={`card-event-${event.id}`}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-start justify-between">
                            <span>{event.title}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedEventId(event.id);
                                projectForm.setValue("eventId", event.id);
                                setIsProjectDialogOpen(true);
                              }}
                              data-testid={`button-add-project-${event.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3" />
                              {client?.fullName || "Unknown Client"}
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {event.eventDate ? format(new Date(event.eventDate), "MMM dd, yyyy") : "No date"}
                            </div>
                            {event.budget && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                ${Number(event.budget).toLocaleString()}
                              </div>
                            )}
                            {event.location && (
                              <Badge variant="secondary" className="text-xs">
                                {event.location}
                              </Badge>
                            )}
                            {eventProjects.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="text-xs font-medium mb-2">Projects ({eventProjects.length})</div>
                                <div className="space-y-1">
                                  {eventProjects.slice(0, 3).map(project => (
                                    <div key={project.id} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground truncate">{project.name}</span>
                                      <Badge variant="secondary" className="text-xs scale-75">
                                        {project.status}
                                      </Badge>
                                    </div>
                                  ))}
                                  {eventProjects.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{eventProjects.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {stageEvents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm glass rounded-lg">
                      No events in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit((data) => createProjectMutation.mutate(data))} className="space-y-4">
              <FormField
                control={projectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Stage Design" data-testid="input-project-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Design, Logistics, etc." data-testid="input-project-type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting_approval">Waiting Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={projectForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-project-duedate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createProjectMutation.isPending} data-testid="button-submit-project">
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}