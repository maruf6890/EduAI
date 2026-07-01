import React from 'react';
import { cn } from '../utils';

interface SkeletonProps {
  className?: string;
}

const SkeletonPulse: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn("animate-pulse bg-muted/40 rounded", className)} />
);

export const MonthViewSkeleton: React.FC = () => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cells = Array.from({ length: 35 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-background border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-7 border-b gradient-header shrink-0">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-7" style={{ gridAutoRows: '120px' }}>
          {cells.map((i) => (
            <div
              key={i}
              className="h-[120px] p-2 border-b border-r border-border/50 last:border-r-0 flex flex-col gap-2"
            >
              <SkeletonPulse className="w-7 h-7 rounded-full" />
              <div className="flex-1 flex flex-col gap-1.5">
                {i % 3 === 0 && <SkeletonPulse className="h-6 w-full rounded-md" />}
                {i % 2 === 0 && <SkeletonPulse className="h-6 w-3/4 rounded-md" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const WeekViewSkeleton: React.FC = () => {
  const weekDays = Array.from({ length: 7 }, (_, i) => i);
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6am to 6pm

  return (
    <div className="flex flex-col h-full bg-background border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex border-b gradient-header shrink-0">
        <div className="flex-none w-16 p-3 text-center border-r border-border/50">
          <SkeletonPulse className="h-4 w-10 mx-auto rounded" />
        </div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((i) => (
            <div key={i} className={cn("py-3 px-2 text-center", i > 0 && "border-l border-border/50")}>
              <SkeletonPulse className="h-3 w-8 mx-auto mb-2 rounded" />
              <SkeletonPulse className="w-8 h-8 mx-auto rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Time Column */}
          <div className="flex-none w-16 border-r border-border/50">
            {hours.map((hour) => (
              <div key={hour} className="h-[60px] flex items-start justify-end pr-3 pt-0">
                <SkeletonPulse className="h-3 w-8 rounded" />
              </div>
            ))}
          </div>
          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((dayIndex) => (
              <div key={dayIndex} className={cn("relative", dayIndex > 0 && "border-l border-border/50")}>
                {hours.map((hour) => (
                  <div key={hour} className="h-[60px] border-b border-dashed border-border/30" />
                ))}
                {/* Random skeleton events */}
                {dayIndex % 2 === 0 && (
                  <div className="absolute top-[120px] left-1 right-1">
                    <SkeletonPulse className="h-[60px] rounded-lg" />
                  </div>
                )}
                {dayIndex % 3 === 1 && (
                  <div className="absolute top-[240px] left-1 right-1">
                    <SkeletonPulse className="h-[90px] rounded-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DayViewSkeleton: React.FC = () => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 6);

  return (
    <div className="flex flex-col h-full bg-background border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b gradient-header text-center shrink-0">
        <SkeletonPulse className="h-6 w-48 mx-auto rounded" />
      </div>
      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Time Column */}
          <div className="w-20 border-r border-border/50">
            {hours.map((hour) => (
              <div key={hour} className="h-[80px] flex items-start justify-center pt-0">
                <SkeletonPulse className="h-3 w-10 rounded" />
              </div>
            ))}
          </div>
          {/* Day Column */}
          <div className="flex-1 relative">
            {hours.map((hour) => (
              <div key={hour} className="h-[80px] border-b border-dashed border-border/30" />
            ))}
            {/* Skeleton events */}
            <div className="absolute top-[160px] left-2 right-2">
              <SkeletonPulse className="h-[80px] rounded-lg" />
            </div>
            <div className="absolute top-[320px] left-2 right-2">
              <SkeletonPulse className="h-[120px] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CalendarSkeleton: React.FC<{ view?: 'month' | 'week' | 'day' }> = ({ view = 'month' }) => {
  switch (view) {
    case 'week':
      return <WeekViewSkeleton />;
    case 'day':
      return <DayViewSkeleton />;
    default:
      return <MonthViewSkeleton />;
  }
};
