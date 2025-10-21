import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Table, Settings, GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertDynamicBoardSchema, 
  insertDynamicFieldSchema,
  insertDynamicItemSchema,
  insertDynamicFieldValueSchema,
  type InsertDynamicBoard,
  type InsertDynamicField,
  type InsertDynamicItem,
  type InsertDynamicFieldValue,
  type DynamicBoard,
  type DynamicField,
  type DynamicItem,
  type DynamicFieldValue
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type FieldType = "text" | "number" | "date" | "status" | "dropdown" | "checkbox";

function SortableColumnHeader({ field, onDelete }: { field: DynamicField; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="p-3 text-left bg-muted/50 border-r last:border-r-0 min-w-[180px]"
      data-testid={`column-${field.id}`}
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium flex-1">{field.name}</span>
        <Badge variant="secondary" className="text-xs">{field.type}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6" data-testid={`button-field-menu-${field.id}`}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-destructive" data-testid={`button-delete-field-${field.id}`}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </th>
  );
}

function EditableCell({ 
  item, 
  field, 
  value,
  onSave 
}: { 
  item: DynamicItem;
  field: DynamicField;
  value?: DynamicFieldValue;
  onSave: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [cellValue, setCellValue] = useState(value?.value || "");

  const handleSave = () => {
    onSave(cellValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setCellValue(value?.value || "");
    }
  };

  if (field.type === "checkbox") {
    return (
      <div className="flex items-center justify-center">
        <Checkbox 
          checked={cellValue === "true"}
          onCheckedChange={(checked) => onSave(String(checked))}
          data-testid={`checkbox-${item.id}-${field.id}`}
        />
      </div>
    );
  }

  if (field.type === "status" || field.type === "dropdown") {
    const options = (field.config as any)?.options as string[] || [];
    return (
      <Select value={cellValue} onValueChange={onSave}>
        <SelectTrigger className="border-0 focus:ring-0" data-testid={`select-${item.id}-${field.id}`}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (isEditing) {
    return (
      <Input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={cellValue}
        onChange={(e) => setCellValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="border-0 focus-visible:ring-1"
        data-testid={`input-${item.id}-${field.id}`}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="px-3 py-2 cursor-pointer hover-elevate rounded min-h-[36px]"
      data-testid={`cell-${item.id}-${field.id}`}
    >
      {cellValue || <span className="text-muted-foreground">Click to edit</span>}
    </div>
  );
}

export default function DynamicBoards() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: boards, isLoading: boardsLoading } = useQuery<DynamicBoard[]>({
    queryKey: ["/api/boards/dynamic"],
    enabled: !!user,
  });

  const { data: fields = [], isLoading: fieldsLoading } = useQuery<DynamicField[]>({
    queryKey: ["/api/boards/dynamic", selectedBoardId, "fields"],
    enabled: !!selectedBoardId,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<DynamicItem[]>({
    queryKey: ["/api/boards/dynamic", selectedBoardId, "items"],
    enabled: !!selectedBoardId,
  });

  const boardForm = useForm<InsertDynamicBoard>({
    resolver: zodResolver(insertDynamicBoardSchema.omit({ ownerId: true })),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fieldForm = useForm<InsertDynamicField>({
    resolver: zodResolver(insertDynamicFieldSchema.omit({ boardId: true, sortIndex: true })),
    defaultValues: {
      name: "",
      type: "text",
      config: {},
    },
  });

  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [currentOption, setCurrentOption] = useState("");

  const createBoardMutation = useMutation({
    mutationFn: async (data: InsertDynamicBoard) => {
      const res = await apiRequest("POST", "/api/boards/dynamic", data);
      return await res.json() as DynamicBoard;
    },
    onSuccess: (newBoard: DynamicBoard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards/dynamic"] });
      toast({ title: "Board created", description: "Your new board has been created successfully" });
      boardForm.reset();
      setBoardDialogOpen(false);
      setSelectedBoardId(newBoard.id);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create board", variant: "destructive" });
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: InsertDynamicField) => {
      const res = await apiRequest("POST", `/api/boards/dynamic/${selectedBoardId}/fields`, {
        ...data,
        sortIndex: fields.length,
        config: data.type === "status" || data.type === "dropdown" 
          ? { options: fieldOptions }
          : {}
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards/dynamic", selectedBoardId, "fields"] });
      toast({ title: "Column added", description: "New column has been added successfully" });
      fieldForm.reset();
      setFieldOptions([]);
      setFieldDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add column", variant: "destructive" });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      return apiRequest("DELETE", `/api/fields/${fieldId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards/dynamic", selectedBoardId, "fields"] });
      toast({ title: "Column deleted", description: "Column has been removed successfully" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (boardId: string) => {
      const res = await apiRequest("POST", `/api/boards/dynamic/${boardId}/items`, { name: "New Item" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards/dynamic", selectedBoardId, "items"] });
    },
  });

  const updateFieldValueMutation = useMutation({
    mutationFn: async ({ itemId, fieldId, value }: { itemId: string; fieldId: string; value: string }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/values`, { fieldId, value });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards/dynamic", selectedBoardId, "items"] });
    },
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: async (fieldOrders: { id: string; sortIndex: number }[]) => {
      const res = await apiRequest("POST", `/api/boards/dynamic/${selectedBoardId}/fields/reorder`, fieldOrders);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards/dynamic", selectedBoardId, "fields"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      
      const newFields = arrayMove(fields, oldIndex, newIndex);
      const fieldOrders = newFields.map((field, index) => ({
        id: field.id,
        sortIndex: index
      }));
      
      queryClient.setQueryData(["/api/boards/dynamic", selectedBoardId, "fields"], newFields);
      reorderFieldsMutation.mutate(fieldOrders);
    }
  };

  const getItemFieldValue = (itemId: string, fieldId: string): DynamicFieldValue | undefined => {
    return queryClient.getQueryData<DynamicFieldValue[]>([`/api/items/${itemId}/values`])?.find(
      v => v.fieldId === fieldId
    );
  };

  if (boardsLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const selectedBoard = boards?.find(b => b.id === selectedBoardId);

  return (
    <div className="p-8 space-y-6 max-w-full">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dynamic-boards-title">Dynamic Boards</h1>
          <p className="text-muted-foreground">Create flexible boards with custom columns</p>
        </div>
        <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-board">
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>Create a flexible board with custom columns</DialogDescription>
            </DialogHeader>
            <Form {...boardForm}>
              <form onSubmit={boardForm.handleSubmit((data) => createBoardMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={boardForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Project Tracker" {...field} data-testid="input-board-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={boardForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description..." {...field} value={field.value || ""} data-testid="input-board-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createBoardMutation.isPending} data-testid="button-submit-board">
                  {createBoardMutation.isPending ? "Creating..." : "Create Board"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!boards || boards.length === 0 ? (
        <Card className="max-w-7xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Table className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-4">Create your first board to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2 max-w-7xl mx-auto flex-wrap">
            {boards.map((board) => (
              <Button
                key={board.id}
                variant={selectedBoardId === board.id ? "default" : "outline"}
                onClick={() => setSelectedBoardId(board.id)}
                data-testid={`button-select-board-${board.id}`}
              >
                {board.name}
              </Button>
            ))}
          </div>

          {selectedBoard && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedBoard.name}</CardTitle>
                    {selectedBoard.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedBoard.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-add-column">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Column
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Column</DialogTitle>
                          <DialogDescription>Add a new column to your board</DialogDescription>
                        </DialogHeader>
                        <Form {...fieldForm}>
                          <form onSubmit={fieldForm.handleSubmit((data) => createFieldMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={fieldForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Column Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Status" {...field} data-testid="input-field-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={fieldForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Column Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-field-type">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                      <SelectItem value="status">Status</SelectItem>
                                      <SelectItem value="dropdown">Dropdown</SelectItem>
                                      <SelectItem value="checkbox">Checkbox</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {(fieldForm.watch("type") === "status" || fieldForm.watch("type") === "dropdown") && (
                              <div className="space-y-2">
                                <FormLabel>Options</FormLabel>
                                <div className="flex gap-2">
                                  <Input
                                    value={currentOption}
                                    onChange={(e) => setCurrentOption(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (currentOption.trim()) {
                                          setFieldOptions([...fieldOptions, currentOption.trim()]);
                                          setCurrentOption("");
                                        }
                                      }
                                    }}
                                    placeholder="Add option"
                                    data-testid="input-field-option"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      if (currentOption.trim()) {
                                        setFieldOptions([...fieldOptions, currentOption.trim()]);
                                        setCurrentOption("");
                                      }
                                    }}
                                    data-testid="button-add-option"
                                  >
                                    Add
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {fieldOptions.map((opt, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      {opt}
                                      <button
                                        onClick={() => setFieldOptions(fieldOptions.filter((_, i) => i !== idx))}
                                        className="ml-2"
                                        data-testid={`button-remove-option-${idx}`}
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Button type="submit" disabled={createFieldMutation.isPending} data-testid="button-submit-field">
                              {createFieldMutation.isPending ? "Adding..." : "Add Column"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => selectedBoardId && createItemMutation.mutate(selectedBoardId)}
                      size="sm"
                      data-testid="button-add-item"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fieldsLoading || itemsLoading ? (
                  <Skeleton className="h-64" />
                ) : fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No columns yet. Add your first column to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="border-b">
                            <th className="p-3 text-left bg-muted/50 border-r w-12">#</th>
                            <SortableContext items={fields.map(f => f.id)} strategy={horizontalListSortingStrategy}>
                              {fields.map((field) => (
                                <SortableColumnHeader
                                  key={field.id}
                                  field={field}
                                  onDelete={() => deleteFieldMutation.mutate(field.id)}
                                />
                              ))}
                            </SortableContext>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={item.id} className="border-b hover-elevate" data-testid={`row-item-${item.id}`}>
                              <td className="p-3 border-r text-muted-foreground text-sm">{idx + 1}</td>
                              {fields.map((field) => (
                                <td key={field.id} className="border-r last:border-r-0">
                                  <EditableCell
                                    item={item}
                                    field={field}
                                    value={getItemFieldValue(item.id, field.id)}
                                    onSave={(value) => updateFieldValueMutation.mutate({ itemId: item.id, fieldId: field.id, value })}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DndContext>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
