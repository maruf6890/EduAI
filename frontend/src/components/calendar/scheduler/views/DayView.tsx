import React, { useMemo } from 'react';
import { format, differenceInMinutes, isToday, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CalendarEvent, ViewType } from '../types';
import { cn } from '../utils';
import { calculateEventPositions, getEventStyle } from '../lib/eventCollision';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date) => void;
  timezone?: string;
  renderEvent?: (props: {
    event: CalendarEvent;
    view: ViewType;
    onClick?: () => void;
  }) => React.ReactNode;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  timezone,
  renderEvent,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourHeight = 80; // Larger height for Day View

  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Timezone adjustment helper
  const getZonedDate = (date: Date) => {
    return timezone ? toZonedTime(date, timezone) : date;
  };

  const zonedNow = getZonedDate(now);

  // Filter events for the current day
  const dayEvents = events.filter(e => {
    const zonedStart = getZonedDate(e.start);
    return isSameDay(zonedStart, currentDate);
  });

  // Calculate positions for overlapping events
  const positionedEvents = useMemo(
    () => calculateEventPositions(dayEvents),
    [dayEvents]
  );

  return (
    <div className="flex flex-col h-full bg-background border rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        {/* Header */}
        <div className="p-4 border-b border-border/50 gradient-header text-center shrink-0">
            <div className="flex items-center justify-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                {isToday(currentDate) && (
                    <span className="text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-md shadow-primary/25">
                        Today
                    </span>
                )}
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto relative">
            <div className="flex relative" style={{ height: hours.length * hourHeight }}>
                {/* Time Labels */}
                <div className="w-20 bg-muted/5 border-r divide-y relative">
                     {hours.map((hour) => (
                        <div 
                            key={hour} 
                            className="relative border-b border-border box-border"
                            style={{ height: hourHeight }}
                        >
                            {hour !== 0 && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium tabular-nums bg-background/50 px-1 rounded-sm">
                                    {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                                </span>
                            )}
                        </div>
                     ))}
                     
                     {/* Left Side Current Time Indicator (Overlay) */}
                     {isToday(currentDate) && (
                         <div 
                             className="absolute left-0 w-full pointer-events-none z-30 flex justify-end pr-2"
                             style={{
                                 top: `${(zonedNow.getHours() * 60 + zonedNow.getMinutes()) / 60 * hourHeight}px`,
                             }}
                         >
                             <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-md shadow-sm -translate-y-1/2">
                                 {format(zonedNow, 'h:mm a')}
                             </span>
                         </div>
                     )}
                </div>

                {/* Day Column */}
                <div className="flex-1 relative">
                     {hours.map((hour) => {
                         const cellDate = new Date(currentDate);
                         cellDate.setHours(hour, 0, 0, 0);
                         const cellId = cellDate.toISOString();

                         return (
                            <div 
                                key={hour}
                                id={cellId}
                                className="border-b border-border/50 border-dashed box-border hover:bg-muted/10 transition-colors cursor-pointer"
                                style={{ height: hourHeight }}
                            >
                                <div 
                                    className="h-full w-full"
                                    onClick={() => {
                                        onTimeSlotClick?.(cellDate);
                                    }}
                                />
                            </div>
                         );
                     })}

                     {positionedEvents.map(({ event, column, totalColumns }) => {
                       const zonedStart = getZonedDate(event.start);
                       const zonedEnd = getZonedDate(event.end);

                       const startMinutes = zonedStart.getHours() * 60 + zonedStart.getMinutes();
                       const durationMinutes = differenceInMinutes(zonedEnd, zonedStart);
                       const top = (startMinutes / 60) * hourHeight;
                       const height = (durationMinutes / 60) * hourHeight;
                       const isSmall = height < 50;

                       // Calculate horizontal position for overlapping events
                       const eventStyle = getEventStyle({ event, column, totalColumns });

                       return (
                         <div
                            key={`${event.id}-${currentDate.toISOString()}`}
                            className="absolute z-10 px-0.5"
                            style={{
                              top: `${top}px`,
                              left: eventStyle.left,
                              width: eventStyle.width,
                              height: `${Math.max(height, 28)}px`,
                            }}
                         >
                            {renderEvent ? (
                              <div
                                className="h-full cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                              >
                                {renderEvent({ event, view: 'day', onClick: () => onEventClick?.(event) })}
                              </div>
                            ) : (
                              <div
                                  className={cn(
                                      "h-full rounded-lg overflow-hidden cursor-pointer shadow-sm transition-all duration-150 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] backdrop-blur-sm",
                                      !event.color && "bg-primary text-primary-foreground",
                                      isSmall ? "px-3 py-1 flex items-center gap-2" : "px-3 py-2"
                                  )}
                                  style={{
                                      backgroundColor: event.color ? `${event.color}ee` : undefined,
                                      color: event.color ? '#fff' : undefined,
                                      borderLeft: `4px solid ${event.color ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)'}`,
                                  }}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onEventClick?.(event);
                                  }}
                              >
                              {isSmall ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-semibold truncate">{event.title}</span>
                                  <span className="text-xs opacity-80 whitespace-nowrap">
                                    {format(zonedStart, 'h:mm')} - {format(zonedEnd, 'h:mm a')}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div className="font-semibold text-sm">{event.title}</div>
                                  <div className="text-xs opacity-90 mb-1">
                                      {format(zonedStart, 'h:mm a')} - {format(zonedEnd, 'h:mm a')}
                                  </div>
                                  {event.description && (
                                      <div className="text-xs opacity-80 line-clamp-2">
                                          {event.description}
                                      </div>
                                  )}
                                </>
                              )}
                              </div>
                            )}
                         </div>
                       );
                     })}
                     
                     {/* Current Time Indicator */}
                     {isToday(currentDate) && (
                       <div
                         className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                         style={{
                           top: `${(zonedNow.getHours() * 60 + zonedNow.getMinutes()) / 60 * hourHeight}px`
                         }}
                       >
                         {/* Line */}
                         <div className="h-[2px] w-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                         {/* Dot */}
                         <div className="absolute -left-1.5 w-3 h-3 bg-primary rounded-full shadow-lg ring-2 ring-background pulse-dot" />
                       </div>
                     )}
                </div>
            </div>
        </div>
    </div>
  );
};
