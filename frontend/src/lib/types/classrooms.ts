import type { Classroom } from '@/lib/types/classroom';

/**
 * Mock data layer for classroom detail lookups.
 *
 * Swap the body of `getClassroomById` for a real fetch once the backend
 * endpoint exists:
 *
 * export async function getClassroomById(classroomId: string): Promise<Classroom | null> {
 *   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms/${classroomId}`, {
 *     cache: 'no-store',
 *   });
 *   if (res.status === 404) return null;
 *   if (!res.ok) throw new Error('Failed to load classroom');
 *   return res.json();
 * }
 */

const mockClassrooms: Classroom[] = [
    {
        id: '1',
        name: 'Introduction to Algorithms',
        code: 'CS-301',
        semester: 'Fall 2026',
        instructor: { name: 'Dr. Amara Whitfield' },
        stats: { students: 42, assignments: 6, quizzes: 3 },
    },
    {
        id: '2',
        name: 'Modern World History',
        code: 'HIS-204',
        semester: 'Fall 2026',
        instructor: { name: 'Mr. Daniel Cho' },
        stats: { students: 35, assignments: 4, quizzes: 5 },
    },
];

/**
 * Returns the classroom for a given id.
 *
 * Falls back to a placeholder classroom (rather than `null`) for ids not
 * present in the mock array. This keeps the redirect-after-create flow
 * working before a real backend exists: a freshly "created" classroom's id
 * won't be in this mock list, but the detail page should still render.
 * Once a real API is wired up, remove the placeholder fallback and return
 * `null` for a true 404 (see `notFound()` usage in the page).
 */
export async function getClassroomById(classroomId: string): Promise<Classroom | null> {
    const found = mockClassrooms.find((c) => c.id === classroomId);
    if (found) return found;

    return {
        id: classroomId,
        name: 'Untitled Classroom',
        semester: 'Current term',
        instructor: { name: 'Instructor to be announced' },
        stats: { students: 0, assignments: 0, quizzes: 0 },
    };
}

export interface CreateClassroomInput {
    name: string;
    section?: string;
    levels?: string;
    subject?: string;
    room?: string;
}

/**
 * Creates a classroom and returns the created record (including its id),
 * matching the shape <CreateClassroom /> expects to hand back to
 * `onSuccess` so the caller can redirect to `/dashboard/classrooms/{id}`.
 *
 * Swap this for a real POST once the backend endpoint exists:
 *
 * export async function createClassroom(input: CreateClassroomInput): Promise<Classroom> {
 *   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classrooms`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(input),
 *   });
 *   if (!res.ok) throw new Error('Failed to create classroom');
 *   return res.json();
 * }
 */
export async function createClassroom(input: CreateClassroomInput): Promise<Classroom> {
    // simulate network latency — remove once wired to a real API
    await new Promise((resolve) => setTimeout(resolve, 600));

    const classroom: Classroom = {
        id:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Date.now().toString(),
        name: input.name.trim(),
        code: input.subject?.trim() || undefined,
        semester: input.levels?.trim() || undefined,
        instructor: { name: 'You' },
        stats: { students: 0, assignments: 0, quizzes: 0 },
    };

    mockClassrooms.push(classroom);
    return classroom;
}