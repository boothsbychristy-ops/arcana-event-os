import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, Calendar, KanbanSquare, LayoutList, Plus, MoreHorizontal, Check, Trash2, Settings } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBoardViewSchema, type BoardView, type InsertBoardView } from "@shared/schema";
import React from "react";

type ViewType = "table" | "kanban" | "calendar" | "timeline";

const VIEW_ICONS = {
  table: Table,
  kanban: KanbanSquare,
  calendar: Calendar,
  timeline: LayoutList,
};

const VIEW_LABELS = {
  table: "Table",
  kanban: "Kanban",
  calendar: "Calendar",
  timeline: "Timeline",
};

interface BoardViewSwitcherProps {
  boardId: string;
  currentView: ViewType;
  onViewChange: (viewType: ViewType, viewConfig?: any) => void;
}

export function BoardViewSwitcher({ boardId, currentView, onViewChange }: BoardViewSwitcherProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: views, isLoading } = useQuery<BoardView[]>({
    queryKey: ["/api/boards", boardId, "views"],
    queryFn: async () => {
      const response = await fetch(`/api/boards/${boardId}/views`);
      if (!response.ok) throw new Error("Failed to fetch views");
      return response.json();
    },
  });

  const form = useForm<InsertBoardView>({
    resolver: zodResolver(insertBoardViewSchema),
    defaultValues: {
      boardId,
      name: "",
      type: "table",
      config: {},
      isDefault: false,
    },
  });

  const createViewMutation = useMutation({
    mutationFn: async (data: InsertBoardView) =>
      apiRequest<BoardView>({
        url: `/api/boards/${boardId}/views`,
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "views"] });
      toast({ title: "View created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create view", variant: "destructive" });
    },
  });

  const deleteViewMutation = useMutation({
    mutationFn: async (viewId: string) =>
      apiRequest({
        url: `/api/views/${viewId}?boardId=${boardId}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "views"] });
      toast({ title: "View deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete view", variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (viewId: string) =>
      apiRequest<BoardView>({
        url: `/api/views/${viewId}/set-default`,
        method: "PATCH",
        body: { boardId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "views"] });
      toast({ title: "Default view updated" });
    },
    onError: () => {
      toast({ title: "Failed to update default view", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertBoardView) => {
    createViewMutation.mutate(data);
  };

  const handleViewClick = (view: BoardView) => {
    onViewChange(view.type as ViewType, view.config);
  };

  const handleDeleteView = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteViewMutation.mutate(viewId);
  };

  const handleSetDefault = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultMutation.mutate(viewId);
  };

  const CurrentIcon = VIEW_ICONS[currentView];

  const defaultView = views?.find(v => v.isDefault);
  const customViews = views?.filter(v => !v.isDefault) || [];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-view-switcher">
            <CurrentIcon className="h-4 w-4" />
            {VIEW_LABELS[currentView]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Quick Views</div>
          {Object.entries(VIEW_ICONS).map(([type, Icon]) => (
            <DropdownMenuItem
              key={type}
              onClick={() => onViewChange(type as ViewType)}
              className="flex items-center gap-2"
              data-testid={`button-view-${type}`}
            >
              <Icon className="h-4 w-4" />
              {VIEW_LABELS[type as ViewType]}
              {currentView === type && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          ))}

          {(customViews.length > 0 || defaultView) && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Saved Views</div>
            </>
          )}

          {defaultView && (
            <DropdownMenuItem
              onClick={() => handleViewClick(defaultView)}
              className="flex items-center gap-2 justify-between"
              data-testid={`button-saved-view-${defaultView.id}`}
            >
              <div className="flex items-center gap-2 flex-1">
                {React.createElement(VIEW_ICONS[defaultView.type as ViewType], { className: "h-4 w-4" })}
                {defaultView.name}
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-5 w-5" data-testid={`button-view-menu-${defaultView.id}`}>
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteView(defaultView.id, e)}
                      className="text-destructive"
                      data-testid={`button-delete-view-${defaultView.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DropdownMenuItem>
          )}

          {customViews.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onClick={() => handleViewClick(view)}
              className="flex items-center gap-2 justify-between"
              data-testid={`button-saved-view-${view.id}`}
            >
              <div className="flex items-center gap-2 flex-1">
                {React.createElement(VIEW_ICONS[view.type as ViewType], { className: "h-4 w-4" })}
                {view.name}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-5 w-5" data-testid={`button-view-menu-${view.id}`}>
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => handleSetDefault(view.id, e)}
                    data-testid={`button-set-default-${view.id}`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleDeleteView(view.id, e)}
                    className="text-destructive"
                    data-testid={`button-delete-view-${view.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-create-view"
          >
            <Plus className="h-4 w-4" />
            Save Current View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save View</DialogTitle>
            <DialogDescription>
              Save your current view configuration for quick access later.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="My Custom View" data-testid="input-view-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-view-type">
                          <SelectValue placeholder="Select view type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(VIEW_LABELS).map(([type, label]) => (
                          <SelectItem key={type} value={type}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createViewMutation.isPending} data-testid="button-save-view">
                  {createViewMutation.isPending ? "Saving..." : "Save View"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
