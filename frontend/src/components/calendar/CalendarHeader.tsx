import React from 'react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Menu, Moon, Sun } from 'lucide-react';
import { ViewType } from './scheduler/types';
import { cn } from './scheduler/utils';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onMenuClick?: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPrev,
  onNext,
  onToday,
  view,
  onViewChange,
  onMenuClick,
  isDarkMode,
  onThemeToggle
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-2 pr-4 border-b bg-background gap-2 md:gap-0 h-auto md:h-16">
      {/* Left Section: Menu, Logo, Title, Navigation */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-1 md:gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full h-10 w-10 md:h-12 md:w-12 hidden md:inline-flex" onClick={onMenuClick}>
                <Menu className="h-6 w-6" />
            </Button>
            
            {/* Logo area - REMOVED */}
            {/* 
            <div className="flex items-center gap-2 mr-2 md:mr-8 min-w-fit">
                 <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-primary rounded-xl text-white font-bold shadow-lg shadow-primary/20">
                     <span className="text-xs md:text-sm font-bold">{format(new Date(), 'd')}</span>
                 </div>
                 <span className="text-lg md:text-xl font-bold text-foreground hidden sm:inline-block font-sans tracking-tight">
                    Planner
                 </span>
            </div>
            */}

            <Button variant="outline" onClick={onToday} className="h-9 px-4 md:px-6 rounded-full text-sm font-medium border-border hidden sm:inline-flex">
                Today
            </Button>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onPrev} className="rounded-full h-8 w-8">
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onNext} className="rounded-full h-8 w-8">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            <h2 className="text-lg md:text-xl font-medium text-foreground ml-2 md:ml-4 whitespace-nowrap">
                {format(currentDate, 'MMMM yyyy')}
            </h2>
        </div>
      </div>

      {/* Right Section: View Switcher & Theme Toggle */}
      <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
        {onThemeToggle && (
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={onThemeToggle}>
                {isDarkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
            </Button>
        )}

        {/* View Switcher */}
        <div className="flex items-center gap-2 border border-border rounded-md p-1 md:border-none md:p-0">
             
             {/* Simple View Switcher */}
             <div className="flex items-center bg-muted/50 rounded-lg p-1">
                <Button 
                    variant={view === 'month' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => onViewChange('month')}
                    className={cn(
                        "h-7 px-3 text-xs rounded-md transition-all",
                        view === 'month' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Month
                </Button>
                <Button 
                    variant={view === 'week' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => onViewChange('week')}
                    className={cn(
                        "h-7 px-3 text-xs rounded-md transition-all",
                        view === 'week' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Week
                </Button>
                <Button 
                    variant={view === 'day' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => onViewChange('day')}
                    className={cn(
                        "h-7 px-3 text-xs rounded-md transition-all",
                        view === 'day' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Day
                </Button>
             </div>
        </div>
      </div>
    </div>
  );
};
