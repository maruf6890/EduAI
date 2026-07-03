"use server";

/**
 * NOTE ON `private_api_call`:
 * This file assumes your existing helper has the signature:
 *
 *   private_api_call<T>(endpoint: string, options?: { method?: string; body?: unknown }): Promise<T>
 *
 * and that it already attaches the JWT / auth headers and returns the JSON body
 * (i.e. the `{ success, message, data }` envelope your FastAPI routes return),
 * throwing on non-2xx responses. Adjust the import path and call signature below
 * if your actual helper differs.
 */
import { private_api_call } from "../private_api_call";
// ─────────────────────────────────────────────────────────────────────────────
// Types — these mirror exactly what the backend returns today.
//
// IMPORTANT: neither the `take` endpoint nor the `my-result` endpoint returns
// the quiz `title`, `description`, or `total_marks`. Per your instructions not
// to invent/mock data, those fields are treated as optional/derived below
// rather than assumed to exist. If you want the quiz title/description shown
// on these pages, the cleanest fix is to have the backend include them in the
// `take` and `my-result` responses.
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export type QuizOption = "A" | "B" | "C" | "D";

export interface QuizQuestion {
    id: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    marks: number;
    order_index: number;
}

export interface TakeQuizData {
    submission_id: number;
    duration_minutes: number | null;
    questions: QuizQuestion[];
}

export interface SubmitAnswerInput {
    question_id: number;
    selected_option: QuizOption;
}

export interface SubmitQuizData {
    id: number;
    quiz_id: number;
    student_id: number;
    started_at: string | null;
    submitted_at: string | null;
    marks_obtained: number;
    status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
    correct_answers: number;
}

export interface QuizResultAnswer {
    question_id: number;
    selected_option: string;
    is_correct: boolean;
    question_text: string;
    correct_option: string;
    marks: number;
}

export interface QuizResultData {
    id: number;
    quiz_id: number;
    student_id: number;
    started_at: string | null;
    submitted_at: string | null;
    marks_obtained: number;
    status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
    answers: QuizResultAnswer[];
}

function toErrorResponse<T>(error: unknown, fallbackMessage: string): ApiResponse<T> {
    return {
        success: false,
        message: error instanceof Error ? error.message : fallbackMessage,
        data: null as unknown as T,
    };
}

/**
 * Starts (or resumes) a quiz attempt.
 * POST /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}/take
 */
export async function takeQuiz(
    classroomId: string,
    quizId: string
): Promise<ApiResponse<TakeQuizData>> {
    try {
        // Change this to use the object syntax your private_api_call expects
        const res = await private_api_call({
            method: "POST",
            path: `/classrooms/${classroomId}/quizzes/${quizId}/take`
        });

        // Cast the result to your expected type
        return res as unknown as ApiResponse<TakeQuizData>;
    } catch (error) {
        return toErrorResponse<TakeQuizData>(error, "We couldn't start this quiz.");
    }
}

/**
 * Submits all answers for the current attempt.
 * POST /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}/submit
 */
export async function submitQuiz(
    classroomId: string,
    quizId: string,
    answers: SubmitAnswerInput[]
): Promise<ApiResponse<SubmitQuizData>> {
    try {
        const res = await private_api_call({
            path: `classrooms/${classroomId}/quizzes/${quizId}/submit`,
            method: "POST", body: { answers }
        });
        return res as unknown as ApiResponse<SubmitQuizData>;
    } catch (error) {
        return toErrorResponse<SubmitQuizData>(error, "Submitting your quiz failed. Please try again.");
    }
}

/**
 * Fetches the current student's result for a quiz.
 * GET /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}/my-result
 */
export async function getMyResult(
    classroomId: string,
    quizId: string
): Promise<ApiResponse<QuizResultData>> {
    try {
        const res = await private_api_call({
            path: `classrooms/${classroomId}/quizzes/${quizId}/my-result`,
            method: "GET"
        }
        );
        return res as unknown as ApiResponse<QuizResultData>;
    } catch (error) {
        return toErrorResponse<QuizResultData>(error, "We couldn't load your result. Please try again.");
    }
}