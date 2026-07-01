import React, { useMemo, useCallback } from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getMonthGrid } from '../lib/date';
import { CalendarEvent, ViewType } from '../types';
import { cn } from '../utils';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  timezone?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  renderEvent?: (props: {
    event: CalendarEvent;
    view: ViewType;
    onClick?: () => void;
  }) => React.ReactNode;
}

// Memoized Event Item Component for performance
const EventItem = React.memo(({ event, onEventClick }: { event: CalendarEvent, onEventClick?: (e: CalendarEvent) => void }) => (
    <div
        className={cn(
          "text-xs px-2 py-1.5 rounded-lg truncate cursor-pointer transition-all duration-150 font-medium flex items-center gap-1.5 group",
          "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
          !event.color && "bg-primary/10 text-primary hover:bg-primary/15"
        )}
        style={event.color ? {
          backgroundColor: `${event.color}15`,
          color: event.color,
        } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
        }}
        title={event.title}
    >
        {/* Color bar indicator */}
        <div
          className="w-1 h-4 rounded-full shrink-0"
          style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
        />
        <span className="truncate">{event.title}</span>
    </div>
));

EventItem.displayName = 'EventItem';

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  timezone,
  weekStartsOn = 0,
  renderEvent,
}) => {
  const days = useMemo(() => getMonthGrid(currentDate, weekStartsOn), [currentDate, weekStartsOn]);

  // Generate weekday labels based on weekStartsOn
  const weekDays = useMemo(() => {
    const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return [...allDays.slice(weekStartsOn), ...allDays.slice(0, weekStartsOn)];
  }, [weekStartsOn]);

  // Timezone adjustment helper
  const getZonedDate = useCallback((date: Date) => {
    return timezone ? toZonedTime(date, timezone) : date;
  }, [timezone]);

  // Pre-calculate event buckets for O(1) access during render
  // This is crucial for handling 10000+ events
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    events.forEach(event => {
      const zonedStart = getZonedDate(event.start);
      // Use date string as key (YYYY-MM-DD)
      const key = format(zonedStart, 'yyyy-MM-dd');
      
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    
    return map;
  }, [events, getZonedDate]);

  return (
    <div className="flex flex-col h-full bg-background border rounded-2xl overflow-hidden min-w-[800px] md:min-w-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      {/* Header */}
      <div className="grid grid-cols-7 border-b gradient-header shrink-0">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      {/* Scrollable grid container */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7" style={{ gridAutoRows: '120px' }}>
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          // O(1) lookup instead of O(N) filter
          const dayEvents = eventsByDay.get(dayKey) || [];

          const isCurrentMonth = isSameMonth(day, currentDate);
          const cellId = day.toISOString();

          return (
            <div
              key={cellId}
              id={cellId}
              className={cn(
                "h-[120px] p-2 border-b border-r border-border/50 last:border-r-0 relative transition-all duration-150 hover:bg-muted/30 flex flex-col gap-1 overflow-hidden cursor-pointer",
                !isCurrentMonth && "text-muted-foreground bg-muted/20",
                isToday(day) && "bg-primary/5"
              )}
              onClick={() => onDateClick?.(day)}
            >
              <div className="flex justify-between items-start">
                <div className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all",
                  isToday(day) && "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
              
              {/*
                Month cell events container:
                - Show exactly 2 events visible in each cell
                - When more than 2, enable vertical scrolling to reveal the rest
                - Smooth scrolling and consistent scrollbar styling
              */}
              <div
                className={cn(
                  "flex-1 flex flex-col gap-1.5 min-h-0",
                  dayEvents.length > 2
                    ? "overflow-y-auto pr-1 scroll-smooth max-h-[64px]"
                    : "overflow-hidden"
                )}
                style={dayEvents.length > 2 ? {
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent'
                } : undefined}
              >
                {dayEvents.map(event => (
                  renderEvent ? (
                    <div key={`${event.id}-${dayKey}`} onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}>
                      {renderEvent({ event, view: 'month', onClick: () => onEventClick?.(event) })}
                    </div>
                  ) : (
                    <EventItem
                      key={`${event.id}-${dayKey}`}
                      event={event}
                      onEventClick={onEventClick}
                    />
                  )
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
