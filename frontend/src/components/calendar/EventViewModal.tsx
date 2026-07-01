import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from './scheduler/types';
import { format } from 'date-fns';
import { X, Clock, CalendarDays, FileText, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface EventViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit?: () => void;
  onDelete?: (eventId: string) => void;
  readOnly?: boolean;
}

export const EventViewModal: React.FC<EventViewModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  readOnly = false,
}) => {
  if (!event) return null;

  const handleDelete = () => {
    if (event.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const formatEventDate = (start: Date, end: Date, allDay?: boolean) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (allDay) {
      return format(startDate, 'EEEE, MMMM d, yyyy');
    }

    const sameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

    if (sameDay) {
      return (
        <>
          <span className="block text-foreground font-medium">
            {format(startDate, 'EEEE, MMMM d, yyyy')}
          </span>
          <span className="block text-muted-foreground mt-1">
            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
          </span>
        </>
      );
    }

    return (
      <>
        <span className="block text-foreground">
          {format(startDate, 'MMM d, h:mm a')} -
        </span>
        <span className="block text-foreground">
          {format(endDate, 'MMM d, h:mm a')}
        </span>
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90%] border border-border overflow-hidden"
          >
            {/* Color Header */}
            <div
              className="relative px-6 py-6 shrink-0"
              style={{
                background: event.color
                  ? `linear-gradient(135deg, ${event.color}30 0%, ${event.color}10 100%)`
                  : 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.05) 100%)'
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Event Title */}
              <h2 className="text-xl font-semibold text-foreground pr-10 leading-tight">
                {event.title}
              </h2>

              {/* Color accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
              />
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Date & Time */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="text-sm">
                    {formatEventDate(event.start, event.end, event.allDay)}
                  </div>
                  {event.allDay && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3" />
                      All day
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!readOnly && (onEdit || onDelete) && (
              <div className="px-6 py-4 border-t border-border flex items-center gap-3 bg-muted/20">
                {onDelete && (
                  <Button
                    variant="ghost"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
                {onEdit && (
                  <Button
                    onClick={onEdit}
                    className="ml-auto rounded-lg px-6"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
