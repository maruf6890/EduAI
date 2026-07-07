import { CalendarEvent } from "../types";
import { CalendarEventResponse, CalendarEventType } from "@/actions/dashboard/calendar";
// ^ adjust this import path to wherever your calendar server actions file actually lives

const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
    QUIZ: "#f59e0b",       // amber
    ASSIGNMENT: "#80392e", // violet
    TASK: "#57adcd",       // teal (classroom-created tasks, rare but possible)
};

const PERSONAL_COLOR = "#6853ba";

// Backend only stores a single point in time (event_date), no end time.
// We synthesize a display duration so the week/day grid can render a block.
export const DEFAULT_EVENT_DURATION_MINUTES = 60;

export function mapEventResponseToCalendarEvent(
    res: CalendarEventResponse
): CalendarEvent {
    const start = new Date(res.event_date);
    const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60_000);

    const calendarId = res.is_personal
        ? "personal"
        : res.classroom_id != null
            ? `classroom-${res.classroom_id}`
            : "classroom";

    const color = res.is_personal
        ? PERSONAL_COLOR
        : EVENT_TYPE_COLORS[res.event_type] ?? "#3897a4";

    return {
        id: String(res.id),
        title: res.title,
        description: res.description ?? undefined,
        start,
        end,
        allDay: false,
        calendarId,
        color,
        // passthrough fields (CalendarEvent allows [key: string]: any)
        isPersonal: res.is_personal,
        eventType: res.event_type,
        classroomId: res.classroom_id,
        classroomName: res.classroom_name,
        referenceId: res.reference_id,
    };
}

// Builds the sidebar "My Calendars" list dynamically: Personal + one entry
// per distinct classroom the user's events belong to.
export function buildCalendarsFromEvents(
    events: CalendarEventResponse[]
): { id: string; label: string; color?: string; active?: boolean }[] {
    const map = new Map<string, { id: string; label: string; color?: string; active?: boolean }>();

    map.set("personal", {
        id: "personal",
        label: "Personal",
        color: PERSONAL_COLOR,
        active: true,
    });

    events.forEach((e) => {
        if (!e.is_personal && e.classroom_id != null) {
            const id = `classroom-${e.classroom_id}`;
            if (!map.has(id)) {
                map.set(id, {
                    id,
                    label: e.classroom_name || `Classroom ${e.classroom_id}`,
                    color: "#3897a4",
                    active: true,
                });
            }
        }
    });

    return Array.from(map.values());
}