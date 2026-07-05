"use server";

import { private_api_call } from "../private_api_call";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export type CalendarEventType = "QUIZ" | "ASSIGNMENT" | "TASK";

export interface CalendarEventResponse {
    id: number;
    classroom_id: number | null;
    title: string;
    description: string | null;
    event_date: string;
    event_type: CalendarEventType;
    reference_id: number | null;
    created_by: number;
    is_personal: boolean;
    created_at: string;
    updated_at: string;
    classroom_name?: string;
}

export interface MyCalendarData {
    classroom_events: CalendarEventResponse[];
    personal_tasks: CalendarEventResponse[];
}

export interface ClassroomCalendarData {
    classroom_events: CalendarEventResponse[];
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    event_date: string;
}

export interface UpdateTaskInput {
    title: string;
    description?: string;
    event_date: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Actions                                   */
/* -------------------------------------------------------------------------- */

/**
 * GET /calendar/my
 */
export async function getMyCalendar(): Promise<ApiResponse<MyCalendarData>> {
    const res = await private_api_call({
        path: "calendar/my",
        method: "GET",
    }) as unknown as ApiResponse<MyCalendarData>;

    if (!res.success) {
        throw new Error(res.message);
    }

    return res;
}

/**
 * GET /calendar/classrooms/{classroomId}
 */
export async function getClassroomCalendar(
    classroomId: string
): Promise<ApiResponse<ClassroomCalendarData>> {
    const res = await private_api_call({
        path: `calendar/classrooms/${classroomId}`,
        method: "GET",
    }) as unknown as ApiResponse<ClassroomCalendarData>;

    if (!res.success) {
        throw new Error(res.message);
    }

    return res;
}

/**
 * POST /calendar/tasks
 */
export async function createTask(
    body: CreateTaskInput
): Promise<ApiResponse<CalendarEventResponse>> {
    const res = await private_api_call({
        path: "calendar/tasks",
        method: "POST",
        body,
    }) as unknown as ApiResponse<CalendarEventResponse>;

    if (!res.success) {
        throw new Error(res.message);
    }

    return res;
}

/**
 * PUT /calendar/tasks/{event_id}
 */
export async function updateTask(
    eventId: string,
    body: UpdateTaskInput
): Promise<ApiResponse<CalendarEventResponse>> {
    const res = await private_api_call({
        path: `calendar/tasks/${eventId}`,
        method: "PUT",
        body,
    }) as unknown as ApiResponse<CalendarEventResponse>;

    if (!res.success) {
        throw new Error(res.message);
    }

    return res;
}

/**
 * DELETE /calendar/tasks/{event_id}
 */
export async function deleteTask(
    eventId: string
): Promise<ApiResponse<null>> {
    const res = await private_api_call({
        path: `calendar/tasks/${eventId}`,
        method: "DELETE",
    }) as ApiResponse<null>;

    if (!res.success) {
        throw new Error(res.message);
    }

    return res;
}