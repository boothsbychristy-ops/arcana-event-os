import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DynamicItem, DynamicField, DynamicFieldValue } from "@shared/schema";
import { useState } from "react";

interface KanbanViewProps {
  items: DynamicItem[];
  fields: DynamicField[];
  fieldValues: DynamicFieldValue[];
  onItemUpdate: (itemId: string, updates: Partial<DynamicItem>) => void;
  onAddItem: (status: string) => void;
  statusField?: DynamicField;
}

export function KanbanView({
  items,
  fields,
  fieldValues,
  onItemUpdate,
  onAddItem,
  statusField,
}: KanbanViewProps) {
  const statusOptions = statusField?.config
    ? (statusField.config as { options?: string[] }).options || []
    : ["To Do", "In Progress", "Done"];

  const getItemValue = (itemId: string, fieldId: string): string => {
    const value = fieldValues.find(
      (v) => v.itemId === itemId && v.fieldId === fieldId
    );
    return value?.value || "";
  };

  const getItemsByStatus = (status: string) => {
    return items.filter((item) => {
      if (!statusField) return status === "To Do";
      const statusValue = getItemValue(item.id, statusField.id);
      return statusValue === status || (!statusValue && status === statusOptions[0]);
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !statusField) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    onItemUpdate(draggableId, { id: draggableId });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {statusOptions.map((status) => {
          const columnItems = getItemsByStatus(status);
          return (
            <div
              key={status}
              className="flex-shrink-0 w-80"
              data-testid={`kanban-column-${status}`}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold" data-testid={`column-title-${status}`}>
                      {status}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnItems.length}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => onAddItem(status)}
                    data-testid={`button-add-item-${status}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] ${
                        snapshot.isDraggingOver ? "bg-accent/20 rounded-md" : ""
                      }`}
                    >
                      {columnItems.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-move ${
                                snapshot.isDragging ? "opacity-50" : ""
                              }`}
                              data-testid={`kanban-card-${item.id}`}
                            >
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="font-medium text-sm" data-testid={`card-title-${item.id}`}>
                                    {item.name}
                                  </div>
                                  {fields
                                    .filter(
                                      (f) =>
                                        f.id !== statusField?.id &&
                                        f.type !== "checkbox"
                                    )
                                    .slice(0, 3)
                                    .map((field) => {
                                      const value = getItemValue(
                                        item.id,
                                        field.id
                                      );
                                      if (!value) return null;
                                      return (
                                        <div
                                          key={field.id}
                                          className="text-xs text-muted-foreground"
                                          data-testid={`card-field-${item.id}-${field.id}`}
                                        >
                                          <span className="font-medium">
                                            {field.name}:
                                          </span>{" "}
                                          {value}
                                        </div>
                                      );
                                    })}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
