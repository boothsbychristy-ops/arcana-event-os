import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Users, Briefcase, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TaskDetailDrawer } from "@/components/task-detail-drawer";
import { format } from "date-fns";

interface CalendarFilters {
  assigneeId?: string;
  clientId?: string;
  status?: string;
  priority?: string;
}

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [filters, setFilters] = useState<CalendarFilters>({});
  const { toast } = useToast();

  // Update calendar view when view state changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  }, [view]);

  // Fetch assignable users for filter
  const { data: assignableUsers = [] } = useQuery({
    queryKey: ["/api/users/assignable"],
  });

  // Fetch clients for filter
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Build query params from filters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.append("from", dateRange.from.toISOString());
    params.append("to", dateRange.to.toISOString());
    
    if (filters.assigneeId) params.append("assignee_id", filters.assigneeId);
    if (filters.clientId) params.append("client_id", filters.clientId);
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    
    return params.toString();
  }, [dateRange, filters]);

  // Fetch calendar events
  const { data: events = [], refetch } = useQuery({
    queryKey: ["/api/calendar/tasks", buildQueryParams()],
    queryFn: async () => {
      const response = await fetch(`/api/calendar/tasks?${buildQueryParams()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      console.log("Calendar events fetched:", data);
      return data;
    },
  });

  // Update dates mutation
  const updateDatesMutation = useMutation({
    mutationFn: async ({ taskId, start, end }: { taskId: string; start: string; end?: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/dates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ start, end }),
      });
      if (!response.ok) throw new Error("Failed to update task dates");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Task date updated successfully" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({ title: "Failed to update task date", variant: "destructive" });
    },
  });

  // Handle event drop (drag to reschedule)
  const handleEventDrop = (info: any) => {
    const taskId = info.event.id;
    const newStart = info.event.start?.toISOString();
    const newEnd = info.event.end?.toISOString();

    if (newStart) {
      updateDatesMutation.mutate({ taskId, start: newStart, end: newEnd });
    }
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    setSelectedTaskId(info.event.id);
    setTaskDrawerOpen(true);
  };

  // Handle view change
  const handleDatesSet = (dateInfo: any) => {
    setDateRange({
      from: dateInfo.start,
      to: dateInfo.end,
    });
  };

  // Event rendering with status colors
  const eventContent = (eventInfo: any) => {
    const statusColors: Record<string, string> = {
      todo: "bg-slate-500",
      in_progress: "bg-amber-500",
      stuck: "bg-rose-500",
      done: "bg-emerald-500",
    };

    const statusColor = statusColors[eventInfo.event.extendedProps.status] || "bg-slate-500";

    return (
      <div className={`fc-event-main-frame border-l-4 ${statusColor} pl-1`} data-testid={`event-${eventInfo.event.id}`}>
        <div className="fc-event-time text-xs opacity-80">{eventInfo.timeText}</div>
        <div className="fc-event-title text-sm font-medium truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">Manage your tasks and schedule</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "dayGridMonth" ? "default" : "outline"}
            onClick={() => setView("dayGridMonth")}
            data-testid="button-view-month"
          >
            Month
          </Button>
          <Button
            variant={view === "timeGridWeek" ? "default" : "outline"}
            onClick={() => setView("timeGridWeek")}
            data-testid="button-view-week"
          >
            Week
          </Button>
          <Button
            variant={view === "timeGridDay" ? "default" : "outline"}
            onClick={() => setView("timeGridDay")}
            data-testid="button-view-day"
          >
            Day
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Assignee Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Users className="h-4 w-4" />
                Assigned To
              </label>
              <Select
                value={filters.assigneeId || "all"}
                onValueChange={(value) => 
                  setFilters({ ...filters, assigneeId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger data-testid="select-filter-assignee">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {assignableUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                Client
              </label>
              <Select
                value={filters.clientId || "all"}
                onValueChange={(value) => 
                  setFilters({ ...filters, clientId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger data-testid="select-filter-client">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex flex-wrap gap-2">
                {["todo", "in_progress", "stuck", "done"].map((status) => (
                  <Badge
                    key={status}
                    variant={filters.status === status ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => 
                      setFilters({ ...filters, status: filters.status === status ? undefined : status })
                    }
                    data-testid={`badge-filter-${status}`}
                  >
                    {status.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex flex-wrap gap-2">
                {["low", "medium", "high", "urgent"].map((priority) => (
                  <Badge
                    key={priority}
                    variant={filters.priority === priority ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => 
                      setFilters({ ...filters, priority: filters.priority === priority ? undefined : priority })
                    }
                    data-testid={`badge-filter-${priority}`}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.assigneeId || filters.clientId || filters.status || filters.priority) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({})}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={view}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              events={events}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              eventContent={eventContent}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
      />
    </div>
  );
}
