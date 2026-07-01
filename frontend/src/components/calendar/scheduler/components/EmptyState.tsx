import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../utils';

interface EmptyStateProps {
  onCreateEvent?: () => void;
  title?: string;
  description?: string;
  className?: string;
  showCreateButton?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateEvent,
  title = 'No events',
  description = 'Get started by creating your first event',
  className,
  showCreateButton = true,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
        {description}
      </p>
      {showCreateButton && onCreateEvent && (
        <Button
          onClick={onCreateEvent}
          className="rounded-full px-6 gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      )}
    </div>
  );
};
