import React from 'react';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { MiniCalendar } from './MiniCalendar';
import { cn } from './scheduler/utils';
import { ViewType } from './scheduler/types';

interface SidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: ViewType) => void;
  onEventCreate?: () => void;
  className?: string;
  readOnly?: boolean;
  calendars?: {
    id: string;
    label: string;
    color?: string;
    active?: boolean;
  }[];
  onCalendarToggle?: (calendarId: string, active: boolean) => void;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentDate,
  onDateChange,
  onViewChange,
  onEventCreate,
  className,
  readOnly,
  calendars,
  onCalendarToggle,
  weekStartsOn = 0,
}) => {
  // Default demo data if no calendars provided
  const defaultCalendars = [
    { id: '1', label: 'My Calendar', color: '#3b82f6', active: true },
    { id: '2', label: 'Birthdays', color: '#10b981', active: true },
    { id: '3', label: 'Tasks', color: '#6366f1', active: true },
  ];

  const displayCalendars = calendars || defaultCalendars;

  return (
    <div className={cn("flex flex-col w-[256px] h-full bg-background border-r border-border pt-3 pb-4 overflow-y-auto hidden lg:flex", className)}>
      {!readOnly && (
        <div className="px-4 mb-6">
            <Button
            className="rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 gap-3 min-w-[140px] justify-start transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            onClick={onEventCreate}
            >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Create</span>
            </Button>
        </div>
      )}

      <MiniCalendar currentDate={currentDate} onDateChange={onDateChange} onViewChange={onViewChange} weekStartsOn={weekStartsOn} />
      <div className="flex-1 px-4 space-y-6 mt-4">
        {/* Calendars List */}
        <div>
          <div className="flex items-center justify-between p-1 -mx-1 mb-3">
            <span className="text-sm font-semibold text-foreground">My Calendars</span>
          </div>

          <div className="space-y-2">
            {displayCalendars.map(cal => (
              <div key={cal.id} className="flex items-center gap-3 py-1.5 px-1">
                <div className="relative flex items-center justify-center">
                  <input
                      type="checkbox"
                      checked={cal.active ?? true}
                      onChange={(e) => onCalendarToggle?.(cal.id, e.target.checked)}
                      className="peer h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer appearance-none border-2 checked:bg-primary checked:border-primary transition-all"
                      style={{ '--primary-color': cal.color } as React.CSSProperties}
                      data-cal-id={cal.id}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                  </div>
                  {/* Custom checkbox color override */}
                  <style>{`
                    /* Scope the style to this specific checkbox using a data attribute or class approach */
                    input[type="checkbox"][data-cal-id="${cal.id}"]:checked {
                      background-color: ${cal.color} !important;
                      border-color: ${cal.color} !important;
                    }
                    /* Focus ring color */
                    input[type="checkbox"][data-cal-id="${cal.id}"]:focus {
                      --tw-ring-color: ${cal.color}40 !important;
                    }
                  `}</style>
                </div>
                <label htmlFor={cal.id} className="text-sm text-foreground font-medium truncate cursor-pointer">
                  {cal.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
