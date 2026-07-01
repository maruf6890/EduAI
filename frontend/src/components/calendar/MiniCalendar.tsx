import React from 'react';
import { format, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { getMonthGrid } from './scheduler/lib/date';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './scheduler/utils';

import { ViewType } from './scheduler/types';

interface MiniCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: ViewType) => void;
  className?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDate,
  onDateChange,
  onViewChange,
  className,
  weekStartsOn = 0,
}) => {
  const [viewDate, setViewDate] = React.useState(currentDate);

  // Sync viewDate with currentDate when it changes externally
  React.useEffect(() => {
    setViewDate(currentDate);
  }, [currentDate]);

  const days = React.useMemo(() => getMonthGrid(viewDate, weekStartsOn), [viewDate, weekStartsOn]);

  // Generate weekday labels based on weekStartsOn
  const weekDays = React.useMemo(() => {
    const allDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return [...allDays.slice(weekStartsOn), ...allDays.slice(0, weekStartsOn)];
  }, [weekStartsOn]);

  const handlePrev = () => {
    const newDate = subMonths(viewDate, 1);
    setViewDate(newDate);
    // Optional: if user wants to sync main calendar on arrow click, uncomment:
    onDateChange(newDate);
    if (onViewChange) onViewChange('month');
  };

  const handleNext = () => {
    const newDate = addMonths(viewDate, 1);
    setViewDate(newDate);
    // Optional: if user wants to sync main calendar on arrow click, uncomment:
    onDateChange(newDate);
    if (onViewChange) onViewChange('month');
  };
  
  const handleDateClick = (day: Date) => {
      onDateChange(day);
      if (onViewChange) onViewChange('day');
  };

  return (
    <div className={cn("p-4 w-[256px]", className)}>
      <div className="flex items-center justify-between mb-4 pl-2">
        <span className="text-sm font-semibold text-foreground">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
        {weekDays.map((day, i) => (
          <div key={`${day}-${i}`} className="text-[10px] text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {days.map(day => {
          const isSelected = isSameDay(day, currentDate);
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-7 w-7 mx-auto flex items-center justify-center text-xs rounded-full transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && "text-foreground hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                !isSelected && isTodayDate && "bg-primary/10 text-primary"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
