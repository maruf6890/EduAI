export interface AssignmentFile {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface Assignment {
  id: number;
  classroom_id: number;
  title: string;
  description: string | null;
  total_marks: number | null;
  due_date: string | null;
  allow_late_submission: boolean;
  is_published: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  files: AssignmentFile[];
}

export interface AssignmentFormState {
  title: string;
  description: string;
  total_marks: string;
  due_date: string;
  allow_late_submission: boolean;
  is_published: boolean;
  files: File[];
}

export const emptyForm: AssignmentFormState = {
  title: "",
  description: "",
  total_marks: "",
  due_date: "",
  allow_late_submission: false,
  is_published: false,
  files: [],
};

// ── Submissions ────────────────────────────────────────────────────────────

export type SubmissionStatus = "DRAFT" | "SUBMITTED" | "LATE" | "GRADED";

export interface SubmissionFile {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  submission_text: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
  files: SubmissionFile[];
}

export interface SubmissionWithStudent extends Submission {
  student: {
    id: number;
    full_name: string;
    email: string;
  };
}