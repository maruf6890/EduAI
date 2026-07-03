export type ClassroomRole = "teacher" | "student";

export interface ClassroomInstructor {
  id?: string;
  name: string;
  avatarUrl?: string;
}

export type UpcomingItemType = "assignment" | "quiz" | "announcement";

export interface UpcomingItem {
  id: string;
  title: string;
  type: UpcomingItemType;
  dueAt: string;
}

export interface ClassroomStats {
  students: number;
  materials: number;
  assignments: number;
  quizzes: number;
}

// ─── Raw backend shapes (DTOs) ──────────────────────────────────────────────
// These intentionally use `?:` liberally and allow both snake_case and
// camelCase — they describe "what the API might actually send", not what we
// want. Keep them loose; the mapper is where we commit to a clean shape.

/** Row shape for `GET /classrooms` (classes the current user teaches). */
export interface CreatedClassroomDTO {
  id: string;
  name?: string;
  course_code?: string;
  courseCode?: string;
  course_title?: string;
  courseTitle?: string;
  description?: string;
  semester?: string;
  cover_image?: string;
  coverImage?: string;
  owner_name?: string;
  accent_gradient?: string;
  accentGradient?: string;
  instructor?: string | ClassroomInstructor;
  stats?: Partial<ClassroomStats>;
  upcoming?: UpcomingItem[];
}

/**
 * Row shape for `GET /enrollments` (classes the current user has joined).
 * Some enrollment APIs return the classroom fields flattened on the
 * enrollment record; others nest a `classroom` object. The mapper handles
 * both — this type just documents that both are possible.
 */
export interface EnrolledClassroomDTO extends Omit<CreatedClassroomDTO, "id"> {
  id?: string;
  classroom_id?: string;
  classroom?: CreatedClassroomDTO;
}

// ─── UI-facing shape ─────────────────────────────────────────────────────────

/**
 * The single shape every classroom-related component renders from.
 * Produced exclusively by `mapToClassroomCard` in `lib/mappers/classroom.ts`.
 */
export interface ClassroomCard {
  id: string;
  name: string;
  courseCode: string;
  /** Full course title, e.g. "Introduction to Algorithms" vs a short `name`. */
  courseTitle?: string;
  description?: string;
  instructor: string;
  coverImage?: string;
  /** Tailwind gradient classes used as the cover stripe when no image provided */
  accentGradient?: string;
  semester: string;
  role: ClassroomRole;
  stats: ClassroomStats;
  upcoming: UpcomingItem[];
}

// ─── Misc ────────────────────────────────────────────────────────────────────

/**
 * Minimal shape returned by the "create classroom" flow — only what
 * `CreateClassModal`'s `onSuccess` callback needs to redirect the user.
 */
export interface Classroom {
  id: string;
  name: string;
  code?: string;
  semester?: string;
  instructor: { name: string };
  stats: { students: number; assignments: number; quizzes: number };
}

export interface ClassroomContextType {
    id: string;
    
  name: string;
    course_code: string;
    course_title?: string;
    description?: string;
    semester: string;
    
  teacher: {
    id: string;
    name: string;
  };
  current_user: {
    id: string;
    role: "teacher" | "student";
  };
}