export type CommunityRole = "teacher" | "student" | null;

export interface CommunityClassroom {
  id: number;
  name: string;
  join_code: string | null;
  course_code: string | null;
  course_title: string;
  description: string | null;
  semester: string | null;
  owner_id: number | null;
  is_active: boolean;
  classroom_type: "NORMAL" | "COMMUNITY";
  topic_slug: string | null;
  created_at: string;
  updated_at: string;
  has_teacher: boolean;
  role: CommunityRole;
}

export interface ClassroomRequestResponse {
  id: number;
  title: string;
  description: string | null;
  requested_by: number;
  status: "PENDING" | "PROCESSED" | "REJECTED";
  created_at: string;
  updated_at: string;
  matched_classrooms: CommunityClassroom[];
}
