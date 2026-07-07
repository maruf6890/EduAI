export type QuizStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED";
export type QuizSubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";

export interface QuizQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_option?: "A" | "B" | "C" | "D"; // only present in teacher views
  marks: number;
  order_index: number;
}

export interface Quiz {
  id: number;
  classroom_id: number;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  duration_minutes: number;
  total_marks: number;
  is_published: boolean;
  status: QuizStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  questions: QuizQuestion[];
}

export interface QuizListItem {
  id: number;
  classroom_id: number;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  duration_minutes: number;
  total_marks: number;
  status: QuizStatus;
  created_at: string;
}

// ── Forms ────────────────────────────────────────────────────────────────────

export interface QuestionFormState {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  marks: string;
  order_index: number;
}

export const emptyQuestion: QuestionFormState = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  marks: "1",
  order_index: 1,
};

export interface QuizFormState {
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: string;
  is_published: boolean;
  questions: QuestionFormState[];
}

export const emptyQuizForm: QuizFormState = {
  title: "",
  description: "",
  scheduled_at: "",
  duration_minutes: "30",
  is_published: false,
  questions: [],
};

// ── Results / submissions ─────────────────────────────────────────────────────

export interface QuizResultRow {
  id: number;
  student_id: number;
  started_at: string;
  submitted_at: string | null;
  marks_obtained: number | null;
  status: QuizSubmissionStatus;
  student: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface TakeQuizData {
  submission_id: number;
  duration_minutes: number;
  questions: QuizQuestion[];
}

export interface QuizAnswerResult {
  question_id: number;
  selected_option: string | null;
  is_correct: boolean;
  question_text: string;
  correct_option: string;
  marks: number;
}

export interface MyQuizResult {
  id: number;
  quiz_id: number;
  student_id: number;
  started_at: string;
  submitted_at: string | null;
  marks_obtained: number | null;
  status: QuizSubmissionStatus;
  answers: QuizAnswerResult[];
}

export interface StudentSubmissionSummary {
  submission_id: number;
  quiz_id: number;
  title: string;
  marks_obtained: number | null;
  total_marks: number;
  status: string;
  submitted_at: string | null;
}