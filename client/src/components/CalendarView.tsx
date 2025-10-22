import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DynamicItem, DynamicField, DynamicFieldValue } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface CalendarViewProps {
  items: DynamicItem[];
  fields: DynamicField[];
  fieldValues: DynamicFieldValue[];
  onItemClick?: (itemId: string) => void;
  onDateClick?: (date: Date) => void;
  dateField?: DynamicField;
}

export function CalendarView({
  items,
  fields,
  fieldValues,
  onItemClick,
  onDateClick,
  dateField,
}: CalendarViewProps) {
  const getItemValue = (itemId: string, fieldId: string): string => {
    const value = fieldValues.find(
      (v) => v.itemId === itemId && v.fieldId === fieldId
    );
    return value?.value || "";
  };

  const events = items.map((item) => {
    const dateValue = dateField
      ? getItemValue(item.id, dateField.id)
      : new Date().toISOString();

    return {
      id: item.id,
      title: item.name,
      start: dateValue || new Date().toISOString(),
      allDay: true,
      extendedProps: {
        item,
      },
    };
  });

  const handleEventClick = (info: any) => {
    if (onItemClick) {
      onItemClick(info.event.id);
    }
  };

  const handleDateClick = (info: any) => {
    if (onDateClick) {
      onDateClick(new Date(info.dateStr));
    }
  };

  return (
    <Card className="p-4" data-testid="calendar-view">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height="auto"
      />
    </Card>
  );
}
