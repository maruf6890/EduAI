from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.quiz import (
    CreateQuizInput,
    QuestionInput,
    SubmitQuizInput,
    UpdateQuizInput,
)
from app.services import quiz_service
from typing import List

router = APIRouter(tags=["Quizzes"])


# ── Teacher: create quiz + questions ─────────────────────────────────────────

@router.post("/classrooms/{classroom_id}/quizzes", status_code=status.HTTP_201_CREATED)
def create_quiz(
    classroom_id: int,
    body: CreateQuizInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.create_quiz(
        conn,
        classroom_id=classroom_id,
        created_by=current_user["id"],
        title=body.title,
        description=body.description,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        is_published=body.is_published,
        questions=body.questions,
    )


# ── Teacher: update quiz ──────────────────────────────────────────────────────

@router.put("/classrooms/{classroom_id}/quizzes/{quiz_id}")
def update_quiz(
    classroom_id: int,
    quiz_id: int,
    body: UpdateQuizInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.update_quiz(
        conn,
        classroom_id=classroom_id,
        quiz_id=quiz_id,
        owner_id=current_user["id"],
        title=body.title,
        description=body.description,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        is_published=body.is_published,
    )


# ── Teacher: add questions to existing quiz ───────────────────────────────────

@router.post("/classrooms/{classroom_id}/quizzes/{quiz_id}/questions", status_code=status.HTTP_201_CREATED)
def add_questions(
    classroom_id: int,
    quiz_id: int,
    body: List[QuestionInput],
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.add_questions(conn, classroom_id, quiz_id, current_user["id"], body)


# ── Teacher: delete a question ────────────────────────────────────────────────

@router.delete("/classrooms/{classroom_id}/quizzes/{quiz_id}/questions/{question_id}")
def delete_question(
    classroom_id: int,
    quiz_id: int,
    question_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.delete_question(conn, classroom_id, quiz_id, question_id, current_user["id"])


# ── Teacher: start quiz ───────────────────────────────────────────────────────

@router.post("/classrooms/{classroom_id}/quizzes/{quiz_id}/start")
def start_quiz(
    classroom_id: int,
    quiz_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.start_quiz(conn, classroom_id, quiz_id, current_user["id"])


# ── Teacher: end quiz ─────────────────────────────────────────────────────────

@router.post("/classrooms/{classroom_id}/quizzes/{quiz_id}/end")
def end_quiz(
    classroom_id: int,
    quiz_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.end_quiz(conn, classroom_id, quiz_id, current_user["id"])


# ── Teacher: delete quiz ──────────────────────────────────────────────────────

@router.delete("/classrooms/{classroom_id}/quizzes/{quiz_id}")
def delete_quiz(
    classroom_id: int,
    quiz_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.delete_quiz(conn, classroom_id, quiz_id, current_user["id"])


# ── Teacher: list all quizzes with questions + answers ───────────────────────

@router.get("/classrooms/{classroom_id}/quizzes/teacher")
def get_quizzes_teacher(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.get_quizzes_teacher(conn, classroom_id, current_user["id"])


# ── Teacher: get quiz results ─────────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/quizzes/{quiz_id}/results")
def get_quiz_results(
    classroom_id: int,
    quiz_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.get_quiz_results(conn, classroom_id, quiz_id, current_user["id"])


# ── Student: list published quizzes ──────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/quizzes/student")
def get_quizzes_student(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.get_quizzes_student(conn, classroom_id, current_user["id"])


# ── Student: start taking quiz (gets questions without answers) ───────────────

@router.post("/classrooms/{classroom_id}/quizzes/{quiz_id}/take")
def start_taking_quiz(
    classroom_id: int,
    quiz_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.start_taking_quiz(conn, classroom_id, quiz_id, current_user["id"])


# ── Student: submit quiz answers ──────────────────────────────────────────────

@router.post("/classrooms/{classroom_id}/quizzes/{quiz_id}/submit")
def submit_quiz(
    classroom_id: int,
    quiz_id: int,
    body: SubmitQuizInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.submit_quiz(conn, classroom_id, quiz_id, current_user["id"], body.answers)


# ── Student: view own result ──────────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/quizzes/{quiz_id}/my-result")
def get_my_quiz_result(
    classroom_id: int,
    quiz_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return quiz_service.get_my_quiz_result(conn, classroom_id, quiz_id, current_user["id"])

@router.get(
    "/classrooms/{classroom_id}/quizzes/{quiz_id}",
    status_code=status.HTTP_200_OK,
)
def get_quiz(
    classroom_id: int,
    quiz_id: int,
    current_user=Depends(get_current_user),
    conn=Depends(get_db),
):
    print("🔥 get_quiz endpoint called")
    return quiz_service.get_quiz_details(
        conn,
        classroom_id,
        quiz_id,
        current_user["id"],
    )

    
