
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { BasicScheduler } from "@/components/calendar/scheduler";
import { CalendarEvent, ViewType } from "@/components/calendar/scheduler/types";
import "./globals.css";
import {
    getMyCalendar,
    createTask,
    updateTask,
    deleteTask,
    CalendarEventResponse,
} from "@/actions/dashboard/calendar";
import {
    mapEventResponseToCalendarEvent,
    buildCalendarsFromEvents,
} from "@/components/calendar/scheduler/lib/adapter";

export default function Home() {
    const [rawEvents, setRawEvents] = useState<CalendarEventResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<ViewType>("week");
    const [date, setDate] = useState(new Date());
    const [calendars, setCalendars] = useState<
        { id: string; label: string; color?: string; active?: boolean }[]
    >([{ id: "personal", label: "Personal", color: "#47b793", active: true }]);

    const fetchCalendar = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getMyCalendar();
            const all = [...res.data.classroom_events, ...res.data.personal_tasks];
            setRawEvents(all);
            setCalendars(buildCalendarsFromEvents(all));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load calendar");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCalendar();
    }, [fetchCalendar]);

    const events = useMemo(
        () => rawEvents.map(mapEventResponseToCalendarEvent),
        [rawEvents]
    );

    const handleCalendarToggle = (calendarId: string, active: boolean) => {
        setCalendars((prev) =>
            prev.map((cal) => (cal.id === calendarId ? { ...cal, active } : cal))
        );
    };

    const filteredEvents = useMemo(() => {
        const activeIds = calendars.filter((c) => c.active).map((c) => c.id);
        return events.filter((e) => !e.calendarId || activeIds.includes(e.calendarId));
    }, [events, calendars]);

    const handleEventCreate = async (newEvent: Partial<CalendarEvent>) => {
        if (!newEvent.start || !newEvent.title) return;
        try {
            await createTask({
                title: newEvent.title,
                description: newEvent.description,
                event_date: newEvent.start.toISOString(),
            });
            await fetchCalendar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create task");
        }
    };

    const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
        // Classroom-sourced events (quizzes/assignments) have no update endpoint.
        if (updatedEvent.isPersonal === false) return;
        try {
            await updateTask(updatedEvent.id, {
                title: updatedEvent.title,
                description: updatedEvent.description,
                event_date: updatedEvent.start.toISOString(),
            });
            await fetchCalendar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update task");
        }
    };

    const handleEventDelete = async (eventId: string) => {
        const target = rawEvents.find((e) => String(e.id) === eventId);
        if (target && !target.is_personal) return; // guard: no delete endpoint for classroom events
        try {
            await deleteTask(eventId);
            await fetchCalendar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete task");
        }
    };

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Academic Calendar</h1>
                        <p className="text-muted-foreground">
                            Manage your teaching schedule, deadlines, quizzes, and classroom activities.
                        </p>
                    </div>
                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                <div className="h-[700px] border rounded-lg overflow-hidden">
                    <BasicScheduler
                        events={filteredEvents}
                        view={view}
                        onViewChange={setView}
                        date={date}
                        onDateChange={setDate}
                        calendars={calendars}
                        onCalendarToggle={handleCalendarToggle}
                        onEventCreate={handleEventCreate}
                        onEventUpdate={handleEventUpdate}
                        onEventDelete={handleEventDelete}
                        isLoading={isLoading}
                        className="h-full"
                    />
                </div>
            </div>
        </main>
    );
}
