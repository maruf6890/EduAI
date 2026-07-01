import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarHeader } from '../CalendarHeader';
import { Sidebar } from '../Sidebar';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { EventModal } from '../EventModal';
import { EventViewModal } from '../EventViewModal';
import { MobileBottomSheet } from '../MobileBottomSheet';
import { CalendarProps } from './types';
import { cn } from './utils';
import { getThemeStyles } from './lib/theme';
import { useCalendarLogic } from './hooks/useCalendarLogic';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { Calendar } from 'lucide-react';

export const BasicScheduler: React.FC<CalendarProps> = ({
    events = [],
    view: controlledView,
    onViewChange: controlledOnViewChange,
    date: controlledDate,
    onDateChange: controlledOnDateChange,
    onEventClick,
    onEventCreate,
    onEventUpdate,
    onEventDelete,
    className,
    theme,
    renderEventForm,
    renderEvent,
    readOnly,
    calendars,
    onCalendarToggle,
    isLoading,
    weekStartsOn = 0,
}) => {
    const {
        view,
        currentDate,
        isSidebarOpen,
        setIsSidebarOpen,
        isModalOpen,
        setIsModalOpen,
        selectedEvent,
        modalInitialDate,
        handleViewChange,
        handleDateChange,
        handlePrev,
        handleNext,
        handleToday,
        handleDateClick,
        handleTimeSlotClick,
        handleEventClickInternal,
        handleCreateEvent,
        handleEditFromView,
        handleModalSave,
        handleModalDelete,
        isViewModalOpen,
        setIsViewModalOpen
    } = useCalendarLogic({
        events,
        view: controlledView,
        onViewChange: controlledOnViewChange,
        date: controlledDate,
        onDateChange: controlledOnDateChange,
        onEventClick,
        onEventUpdate,
        onEventCreate,
        onEventDelete,
        readOnly
    });

    const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);

    // Swipe gesture for mobile navigation
    const swipeRef = useSwipeGesture({
        onSwipeLeft: handleNext,
        onSwipeRight: handlePrev,
        threshold: 50,
        enabled: true,
    });

    return (
        <div
            className={cn("flex flex-col h-full w-full bg-background text-foreground relative", className)}
            style={getThemeStyles(theme)}
        >
            <CalendarHeader
                currentDate={currentDate}
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
                view={view}
                onViewChange={handleViewChange}
                onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <div className="flex flex-1 overflow-hidden h-full">
                <div className={cn(
                    "transition-all duration-300 ease-in-out h-full",
                    isSidebarOpen ? "w-[256px]" : "w-0 overflow-hidden",
                    "hidden md:block"
                )}>
                    <Sidebar
                        currentDate={currentDate}
                        onDateChange={handleDateChange}
                        onViewChange={handleViewChange}
                        onEventCreate={handleCreateEvent}
                        className="w-full h-full border-r"
                        readOnly={readOnly}
                        calendars={calendars}
                        onCalendarToggle={onCalendarToggle}
                        weekStartsOn={weekStartsOn}
                    />
                </div>

                <div className="flex-1 flex flex-col overflow-hidden relative h-full">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}
                    <div ref={swipeRef} className="flex-1 overflow-auto p-0 md:p-4 h-full touch-pan-y">
                        <div className="h-full min-w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${view}-${currentDate.toISOString()}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="h-full"
                                >
                                    {view === 'month' && (
                                        <MonthView
                                            currentDate={currentDate}
                                            events={events}
                                            onEventClick={handleEventClickInternal}
                                            onDateClick={handleDateClick}
                                            weekStartsOn={weekStartsOn}
                                            renderEvent={renderEvent}
                                        />
                                    )}
                                    {view === 'week' && (
                                        <WeekView
                                            currentDate={currentDate}
                                            events={events}
                                            onEventClick={handleEventClickInternal}
                                            onTimeSlotClick={handleTimeSlotClick}
                                            weekStartsOn={weekStartsOn}
                                            renderEvent={renderEvent}
                                        />
                                    )}
                                    {view === 'day' && (
                                        <DayView
                                            currentDate={currentDate}
                                            events={events}
                                            onEventClick={handleEventClickInternal}
                                            onTimeSlotClick={handleTimeSlotClick}
                                            renderEvent={renderEvent}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="md:hidden absolute bottom-6 right-6 flex flex-col gap-3">
                        {/* Calendar/Filter Button */}
                        <button
                            onClick={() => setIsMobileSheetOpen(true)}
                            className="w-12 h-12 bg-background border-2 border-border rounded-full shadow-lg flex items-center justify-center text-foreground active:scale-90 transition-transform"
                            aria-label="Open calendar"
                        >
                            <Calendar className="w-5 h-5" />
                        </button>

                        {/* Create Button (FAB) */}
                        {!readOnly && (
                            <button
                                onClick={handleCreateEvent}
                                className="w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground active:scale-90 transition-transform"
                                aria-label="Create event"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {renderEventForm ? (
                renderEventForm({
                    isOpen: isModalOpen,
                    onClose: () => setIsModalOpen(false),
                    event: selectedEvent,
                    initialDate: modalInitialDate,
                    onSave: handleModalSave,
                    onDelete: handleModalDelete
                })
            ) : (
                <EventModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    event={selectedEvent}
                    initialDate={modalInitialDate}
                    onSave={handleModalSave}
                    onDelete={handleModalDelete}
                    calendars={calendars}
                />
            )}

            {/* Event View Modal - Read-only view with Edit/Delete options */}
            <EventViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                event={selectedEvent}
                onEdit={handleEditFromView}
                onDelete={handleModalDelete}
                readOnly={readOnly}
            />

            {/* Mobile Bottom Sheet */}
            <MobileBottomSheet
                isOpen={isMobileSheetOpen}
                onClose={() => setIsMobileSheetOpen(false)}
                currentDate={currentDate}
                onDateChange={handleDateChange}
                onViewChange={handleViewChange}
                calendars={calendars}
                onCalendarToggle={onCalendarToggle}
            />
        </div>
    );
};

// Export types for consumers
export type { CalendarEvent, ViewType, CalendarProps } from './types';

// Export components
export { CalendarSkeleton, MonthViewSkeleton, WeekViewSkeleton, DayViewSkeleton } from './components/Skeleton';
export { EmptyState } from './components/EmptyState';

// Default export
export default BasicScheduler;
