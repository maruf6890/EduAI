import { useState } from 'react';
import { 
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, 
  differenceInMilliseconds 
} from 'date-fns';
import { ViewType, CalendarEvent } from '../types';

interface UseCalendarLogicProps {
  events: CalendarEvent[];
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
  date?: Date;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => void;
  onEventDelete?: (eventId: string) => void;
  readOnly?: boolean;
}

export const useCalendarLogic = ({
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
}: UseCalendarLogicProps) => {
  const [internalView, setInternalView] = useState<ViewType>('week');
  const [internalDate, setInternalDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>(undefined);

  const view = controlledView ?? internalView;
  const currentDate = controlledDate ?? internalDate;

  const handleViewChange = (newView: ViewType) => {
    if (controlledOnViewChange) {
      controlledOnViewChange(newView);
    } else {
      setInternalView(newView);
    }
  };

  const handleDateChange = (newDate: Date) => {
    if (controlledOnDateChange) {
      controlledOnDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const handlePrev = () => {
    switch (view) {
      case 'month':
        handleDateChange(subMonths(currentDate, 1));
        break;
      case 'week':
        handleDateChange(subWeeks(currentDate, 1));
        break;
      case 'day':
        handleDateChange(subDays(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'month':
        handleDateChange(addMonths(currentDate, 1));
        break;
      case 'week':
        handleDateChange(addWeeks(currentDate, 1));
        break;
      case 'day':
        handleDateChange(addDays(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    handleDateChange(new Date());
  };

  const handleDateClick = (date: Date) => {
    handleDateChange(date);
    handleViewChange('day');
  };

  const handleTimeSlotClick = (date: Date) => {
      if (readOnly) return;
      setSelectedEvent(null);
      setModalInitialDate(date);
      setIsModalOpen(true);
  };
  
  const handleEventClickInternal = (event: CalendarEvent) => {
      if (onEventClick) {
          onEventClick(event);
      }

      // Open view modal for existing events
      setSelectedEvent(event);
      setModalInitialDate(undefined);
      setIsViewModalOpen(true);
  };

  const handleEditFromView = () => {
      // Close view modal and open edit modal
      setIsViewModalOpen(false);
      setIsModalOpen(true);
  };

  const handleCreateEvent = () => {
      if (readOnly) return;
      setSelectedEvent(null);
      setModalInitialDate(new Date());
      setIsModalOpen(true);
  };

  const handleModalSave = (eventData: Partial<CalendarEvent>) => {
      if (selectedEvent) {
          // Update existing
          if (onEventUpdate) {
              onEventUpdate(eventData as CalendarEvent);
          }
      } else {
          // Create new
          if (onEventCreate) {
              onEventCreate(eventData);
          }
      }
  };
  
  const handleModalDelete = (eventId: string) => {
      if (onEventDelete) {
          onEventDelete(eventId);
      }
  };

  return {
    view,
    currentDate,
    isSidebarOpen,
    setIsSidebarOpen,
    isModalOpen,
    setIsModalOpen,
    isViewModalOpen,
    setIsViewModalOpen,
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
    handleModalDelete
  };
};
