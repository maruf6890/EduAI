/**
 * @description: Backend DTO -> ClassroomCard normalization
 *
 * This is the *only* place that should know about backend field-naming
 * quirks (snake_case vs camelCase, `course_title` vs `name`, a nested
 * `classroom` object on enrollment rows, etc). Every component downstream
 * consumes `ClassroomCard` and nothing else.
 */

import type {
    ClassroomCard,
    ClassroomRole,
    CreatedClassroomDTO,
    EnrolledClassroomDTO,
} from '@/lib/types/classrooms';

function resolveInstructorName(
    instructor: CreatedClassroomDTO['instructor'],
): string {
    if (!instructor) return 'Instructor to be announced';
    if (typeof instructor === 'string') return instructor;
    return instructor.name || 'Instructor to be announced';
}

/**
 * Normalizes a single raw classroom-ish record (from either `/classrooms`
 * or the resolved `/enrollments` row) into the strict `ClassroomCard` shape.
 *
 * `role` is passed explicitly rather than inferred from the payload, since
 * it's determined by *which endpoint* the record came from, not by any
 * field on the record itself.
 */
export function mapToClassroomCard(
    raw: CreatedClassroomDTO,
    role: ClassroomRole,
): ClassroomCard {
    const courseCode = raw.course_code ?? raw.courseCode ?? 'N/A';
    const courseTitle = raw.course_title ?? raw.courseTitle;

    return {
        id: raw.id,
        // `name` is the primary display title; fall back to course_title, then
        // course_code, so a record is never rendered with a blank heading.
        name: raw.name ?? courseTitle ?? courseCode,
        courseCode,
        courseTitle,
        description: raw.description,
        instructor: resolveInstructorName(raw.owner_name ?? raw.instructor),
        coverImage: raw.cover_image ?? raw.coverImage,
        accentGradient: raw.accent_gradient ?? raw.accentGradient,
        semester: raw.semester ?? 'Current term',
        role,
        stats: {
            students: raw.stats?.students ?? 0,
            materials: raw.stats?.materials ?? 0,
            assignments: raw.stats?.assignments ?? 0,
            quizzes: raw.stats?.quizzes ?? 0,
        },
        upcoming: raw.upcoming ?? [],
    };
}

/**
 * Enrollment rows sometimes flatten classroom fields directly onto the
 * enrollment record, and sometimes nest them under `classroom`. This picks
 * whichever is present before handing off to `mapToClassroomCard`.
 */
export function mapEnrollmentToClassroomCard(
    raw: EnrolledClassroomDTO,
): ClassroomCard {
    const source: CreatedClassroomDTO = raw.classroom ?? {
        ...raw,
        id: raw.id ?? raw.classroom_id ?? '',
    };

    const id = raw.classroom?.id ?? raw.id ?? raw.classroom_id ?? source.id;

    return mapToClassroomCard({ ...source, id }, 'student');
}

/** Maps a full `GET /classrooms` response body into `ClassroomCard[]`. */
export function mapCreatedClassrooms(items: CreatedClassroomDTO[]): ClassroomCard[] {
    return items.map((item) => mapToClassroomCard(item, 'teacher'));
}

/** Maps a full `GET /enrollments` response body into `ClassroomCard[]`. */
export function mapEnrolledClassrooms(items: EnrolledClassroomDTO[]): ClassroomCard[] {
    return items.map(mapEnrollmentToClassroomCard);
}