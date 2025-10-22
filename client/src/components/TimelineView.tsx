import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DynamicItem, DynamicField, DynamicFieldValue } from "@shared/schema";
import { format, parseISO } from "date-fns";

interface TimelineViewProps {
  items: DynamicItem[];
  fields: DynamicField[];
  fieldValues: DynamicFieldValue[];
  onItemClick?: (itemId: string) => void;
  dateField?: DynamicField;
  statusField?: DynamicField;
}

export function TimelineView({
  items,
  fields,
  fieldValues,
  onItemClick,
  dateField,
  statusField,
}: TimelineViewProps) {
  const getItemValue = (itemId: string, fieldId: string): string => {
    const value = fieldValues.find(
      (v) => v.itemId === itemId && v.fieldId === fieldId
    );
    return value?.value || "";
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!dateField) return 0;
    const dateA = getItemValue(a.id, dateField.id);
    const dateB = getItemValue(b.id, dateField.id);
    if (!dateA || !dateB) return 0;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('complete')) return 'bg-green-500';
    if (statusLower.includes('progress') || statusLower.includes('active')) return 'bg-blue-500';
    if (statusLower.includes('blocked') || statusLower.includes('issue')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-4" data-testid="timeline-view">
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
        {sortedItems.map((item, index) => {
          const dateValue = dateField ? getItemValue(item.id, dateField.id) : null;
          const statusValue = statusField ? getItemValue(item.id, statusField.id) : null;
          const statusColor = statusValue ? getStatusColor(statusValue) : 'bg-gray-500';

          return (
            <div key={item.id} className="relative mb-8" data-testid={`timeline-item-${item.id}`}>
              <div className={`absolute left-[-29px] w-4 h-4 rounded-full ${statusColor} border-2 border-background`} />
              <Card
                className="cursor-pointer hover-elevate"
                onClick={() => onItemClick?.(item.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold" data-testid={`timeline-title-${item.id}`}>
                        {item.name}
                      </h3>
                      {dateValue && (
                        <div className="text-sm text-muted-foreground" data-testid={`timeline-date-${item.id}`}>
                          {format(parseISO(dateValue), 'PPP')}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {statusValue && (
                          <Badge variant="secondary" data-testid={`timeline-status-${item.id}`}>
                            {statusValue}
                          </Badge>
                        )}
                        {fields
                          .filter(
                            (f) =>
                              f.id !== dateField?.id &&
                              f.id !== statusField?.id &&
                              f.type !== "checkbox"
                          )
                          .slice(0, 3)
                          .map((field) => {
                            const value = getItemValue(item.id, field.id);
                            if (!value) return null;
                            return (
                              <div
                                key={field.id}
                                className="text-xs text-muted-foreground"
                                data-testid={`timeline-field-${item.id}-${field.id}`}
                              >
                                <span className="font-medium">{field.name}:</span> {value}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
