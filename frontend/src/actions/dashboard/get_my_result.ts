"use server";

import { private_api_call } from "@/actions/private_api_call";

/* =========================================================================
   GENERIC API RESPONSE WRAPPER
   ========================================================================= */

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

/* =========================================================================
   TYPES — match backend response EXACTLY, no invented fields
   ========================================================================= */

export interface Answer {
    question_id: number;
    selected_option: "A" | "B" | "C" | "D";
    is_correct: boolean;
    question_text: string;
    correct_option: "A" | "B" | "C" | "D";
    marks: number;
}

export interface QuizSubmissionResult {
    id: number;
    quiz_id: number;
    student_id: number;
    started_at: string; // ISO datetime
    submitted_at: string | null; // ISO datetime
    marks_obtained: number;
    status: "SUBMITTED" | "IN_PROGRESS" | "EXPIRED"; // extend if backend adds more
    answers: Answer[];
}

/* =========================================================================
   ACTION
   ========================================================================= */


//    /api/v1/classrooms/{classroom_id}/quizzes/{quiz_id}/my-result
export async function getMyResult(
    classroomId: string,
    quizId: string
): Promise<ApiResponse<QuizSubmissionResult>> {
    const res = await private_api_call({
        path: `classrooms/${classroomId}/quizzes/${quizId}/my-result`,
        method: "GET",
    });

    if (res.success) {
        return res as unknown as ApiResponse<QuizSubmissionResult>;
    }

    throw new Error(res.message);
}