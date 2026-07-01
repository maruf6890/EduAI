import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from './scheduler/utils';
import { MiniCalendar } from './MiniCalendar';  
import { ViewType } from './scheduler/types';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: ViewType) => void;
  calendars?: {
    id: string;
    label: string;
    color?: string;
    active?: boolean;
  }[];
  onCalendarToggle?: (calendarId: string, active: boolean) => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  currentDate,
  onDateChange,
  onViewChange,
  calendars,
  onCalendarToggle,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col md:hidden",
          "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Calendar</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Mini Calendar */}
          <div>
            <MiniCalendar
              currentDate={currentDate}
              onDateChange={onDateChange}
              onViewChange={onViewChange}
            />
          </div>

          {/* Calendars Filter */}
          {calendars && calendars.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">My Calendars</h3>
              <div className="space-y-2">
                {calendars.map(cal => (
                  <div
                    key={cal.id}
                    className="flex items-center gap-3 py-2 px-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => onCalendarToggle?.(cal.id, !(cal.active ?? true))}
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={cal.active ?? true}
                        onChange={(e) => {
                          e.stopPropagation();
                          onCalendarToggle?.(cal.id, e.target.checked);
                        }}
                        className="peer h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer appearance-none border-2 checked:bg-primary checked:border-primary transition-all"
                        style={{ '--primary-color': cal.color } as React.CSSProperties}
                        data-cal-id={cal.id}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <style>{`
                        input[type="checkbox"][data-cal-id="${cal.id}"]:checked {
                          background-color: ${cal.color} !important;
                          border-color: ${cal.color} !important;
                        }
                        input[type="checkbox"][data-cal-id="${cal.id}"]:focus {
                          --tw-ring-color: ${cal.color}40 !important;
                        }
                      `}</style>
                    </div>
                    <span className="text-sm text-foreground font-medium flex-1">{cal.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
