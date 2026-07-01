import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/button';
import { CalendarEvent } from './scheduler/types';
import { format } from 'date-fns';
import { ChevronDown, Check, Clock, CalendarDays, Trash2 } from 'lucide-react';
import { cn } from './scheduler/utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  initialDate?: Date;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete?: (eventId: string) => void;
  calendars?: { id: string; label: string; color?: string }[];
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  initialDate,
  onSave,
  onDelete,
  calendars,
}) => {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    color: '#3b82f6',
    calendarId: calendars?.[0]?.id,
  });

  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setFormData({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        });
        setIsDescriptionExpanded(!!event.description);
      } else {
        const start = initialDate || new Date();
        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        setFormData({
          title: '',
          description: '',
          start,
          end,
          allDay: false,
          color: '#3b82f6',
          calendarId: calendars?.[0]?.id,
        });
        setIsDescriptionExpanded(false);
      }
    }
  }, [isOpen, event, initialDate, calendars]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let eventColor = formData.color;
    if (formData.calendarId && calendars) {
      const selectedCal = calendars.find(c => c.id === formData.calendarId);
      if (selectedCal?.color) {
        eventColor = selectedCal.color;
      }
    }

    onSave({
      ...formData,
      color: eventColor,
      id: event?.id,
    });
    onClose();
  };

  const handleDelete = () => {
    if (event?.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const date = new Date(value);
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const currentColor = formData.calendarId && calendars
    ? calendars.find(c => c.id === formData.calendarId)?.color || formData.color
    : formData.color;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Edit Event' : 'New Event'}
      headerColor={currentColor}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title Input - Large, borderless style */}
        <div>
          <input
            type="text"
            required
            className="w-full text-lg font-medium bg-transparent border-0 border-b-2 border-border/50 focus:border-primary px-0 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 transition-colors"
            value={formData.title || ''}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Add title"
            autoFocus
          />
        </div>

        {/* Date/Time Card */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <CalendarDays className="w-4 h-4" />
            <span className="font-medium">Date & Time</span>
          </div>

          {/* Start */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">From</span>
            <div className="flex-1 flex gap-2">
              <input
                type="datetime-local"
                required
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formatDateForInput(formData.start)}
                onChange={e => handleDateChange('start', e.target.value)}
              />
            </div>
          </div>

          {/* End */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">To</span>
            <div className="flex-1 flex gap-2">
              <input
                type="datetime-local"
                required
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formatDateForInput(formData.end)}
                onChange={e => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">All day</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!formData.allDay}
              onClick={() => setFormData({ ...formData, allDay: !formData.allDay })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                formData.allDay ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  formData.allDay && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Calendar Selector or Color Picker */}
        {calendars && calendars.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Calendar
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCalendarDropdownOpen(!isCalendarDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: calendars.find(c => c.id === formData.calendarId)?.color || formData.color }}
                  />
                  <span className="text-sm">{calendars.find(c => c.id === formData.calendarId)?.label || 'Select Calendar'}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isCalendarDropdownOpen && "rotate-180")} />
              </button>

              {isCalendarDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCalendarDropdownOpen(false)} />
                  <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                    {calendars.map(cal => (
                      <div
                        key={cal.id}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                          formData.calendarId === cal.id && "bg-primary/5"
                        )}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            calendarId: cal.id,
                            color: cal.color || formData.color
                          });
                          setIsCalendarDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: cal.color }}
                          />
                          <span className="text-sm text-foreground">{cal.label}</span>
                        </div>
                        {formData.calendarId === cal.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Color
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full transition-all hover:scale-110 focus:outline-none",
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                      : "hover:ring-1 hover:ring-border"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Description - Expandable */}
        <div>
          {!isDescriptionExpanded ? (
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              + Add description
            </button>
          ) : (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                rows={3}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description..."
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          {event && onDelete && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg px-6">
              {event ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
