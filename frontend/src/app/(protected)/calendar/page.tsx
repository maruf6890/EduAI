"use client";

import { useState, useMemo } from "react";
import { BasicScheduler } from "@/components/calendar/scheduler";
import { CalendarEvent, ViewType } from "@/components/calendar/scheduler/types";
import { addDays, startOfWeek, addHours } from "date-fns";
// Ensure this is at the very top of your file
import "./globals.css";

// OR if you are using the specific 'calendarkit' styles:


// Generate demo events
const generateDemoEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const today = new Date();
    const weekStart = startOfWeek(today);

    const createEvent = (
        id: string,
        title: string,
        dayOffset: number,
        hourStart: number,
        duration: number,
        calendarId: string,
        color: string
    ): CalendarEvent => {
        const start = addHours(addDays(weekStart, dayOffset), hourStart);
        const end = addHours(start, duration);
        return { id, title, start, end, calendarId, color };
    };

    // Monday
    events.push(createEvent("1", "Team Standup", 1, 9, 0.5, "work", "#3897a4"));
    events.push(createEvent("2", "Project Review", 1, 10, 2, "work", "#3897a4"));
    events.push(createEvent("3", "Lunch Meeting", 1, 12, 1, "personal", "#47b793"));

    // Tuesday
    events.push(createEvent("4", "Client Call", 2, 9, 1, "work", "#3897a4"));
    events.push(createEvent("5", "Code Review", 2, 14, 1.5, "work", "#3897a4"));

    // Wednesday
    events.push(createEvent("6", "Workshop", 3, 10, 3, "work", "#3897a4"));
    events.push(createEvent("7", "Gym", 3, 17, 1, "personal", "#47b793"));

    // Thursday
    events.push(createEvent("8", "Sprint Planning", 4, 9, 2, "work", "#3897a4"));
    events.push(createEvent("9", "1:1 Meeting", 4, 14, 0.5, "work", "#3897a4"));

    // Friday
    events.push(createEvent("10", "Demo Day", 5, 14, 2, "work", "#3897a4"));
    events.push(createEvent("11", "Happy Hour", 5, 17, 2, "personal", "#47b793"));

    return events;
};

export default function Home() {
    const [events, setEvents] = useState<CalendarEvent[]>(generateDemoEvents());
    const [view, setView] = useState<ViewType>("week");
    const [date, setDate] = useState(new Date());

    const [calendars, setCalendars] = useState([
        { id: "work", label: "Work", color: "#3b82f6", active: true },
        { id: "personal", label: "Personal", color: "#10b981", active: true },
    ]);

    const handleCalendarToggle = (calendarId: string, active: boolean) => {
        setCalendars((prev) =>
            prev.map((cal) => (cal.id === calendarId ? { ...cal, active } : cal))
        );
    };

    const filteredEvents = useMemo(() => {
        const activeIds = calendars.filter((c) => c.active).map((c) => c.id);
        return events.filter((e) => !e.calendarId || activeIds.includes(e.calendarId));
    }, [events, calendars]);

    const handleEventCreate = (newEvent: Partial<CalendarEvent>) => {
        const event: CalendarEvent = {
            ...newEvent,
            id: Math.random().toString(36).substr(2, 9),
            start: newEvent.start as Date,
            end: newEvent.end as Date,
            title: newEvent.title || "New Event",
            color: calendars.find((c) => c.id === newEvent.calendarId)?.color || "#3b82f6",
        };
        setEvents((prev) => [...prev, event]);
    };

    const handleEventUpdate = (updatedEvent: CalendarEvent) => {
        setEvents((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
        );
    };

    const handleEventDelete = (eventId: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
    };

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Academic Calendar
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your teaching schedule, deadlines, quizzes, and classroom activities.                    </p>
                </div>

                <div className="h-[700px] border rounded-lg overflow-hidden">
                    <BasicScheduler
                        events={filteredEvents}
                        view={view as "month" | "week" | "day"}
                        onViewChange={(v) => {
                            setView(v);
                        }}
                        date={date}
                        onDateChange={setDate}
                        calendars={calendars}
                        onCalendarToggle={handleCalendarToggle}
                        onEventCreate={handleEventCreate}
                        onEventUpdate={handleEventUpdate}
                        onEventDelete={handleEventDelete}
                        className="h-full"
                    />
                </div>
            </div>
        </main>
    );
}
