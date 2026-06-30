from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.assignment import GradeSubmissionInput, UpdateAssignmentInput
from app.services import assignment_service

router = APIRouter(tags=["Assignments"])


# ── Teacher: create assignment + optional files in one request ───────────────

@router.post("/classrooms/{classroom_id}/assignments", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    classroom_id: int,
    title: str                        = Form(...),
    description: Optional[str]        = Form(None),
    total_marks: Optional[int]        = Form(None),
    due_date: Optional[datetime]      = Form(None),
    allow_late_submission: bool       = Form(False),
    is_published: bool                = Form(False),
    files: List[UploadFile]           = File(default=[]),
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return await assignment_service.create_assignment(
        conn,
        classroom_id=classroom_id,
        created_by=current_user["id"],
        title=title,
        description=description,
        total_marks=total_marks,
        due_date=due_date,
        allow_late_submission=allow_late_submission,
        is_published=is_published,
        files=files or [],
    )


# ── Teacher: update assignment ───────────────────────────────────────────────

@router.put("/classrooms/{classroom_id}/assignments/{assignment_id}")
def update_assignment(
    classroom_id: int,
    assignment_id: int,
    body: UpdateAssignmentInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return assignment_service.update_assignment(
        conn,
        classroom_id=classroom_id,
        assignment_id=assignment_id,
        owner_id=current_user["id"],
        title=body.title,
        description=body.description,
        total_marks=body.total_marks,
        due_date=body.due_date,
        allow_late_submission=body.allow_late_submission,
        is_published=body.is_published,
    )


# ── Teacher: delete assignment ───────────────────────────────────────────────

@router.delete("/classrooms/{classroom_id}/assignments/{assignment_id}")
def delete_assignment(
    classroom_id: int,
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return assignment_service.delete_assignment(conn, classroom_id, assignment_id, current_user["id"])


# ── List assignments ─────────────────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/assignments")
def get_assignments(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return assignment_service.get_assignments(conn, classroom_id, current_user["id"])


@router.get("/classrooms/{classroom_id}/assignments/{assignment_id}")
def get_assignment(
    classroom_id: int,
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return assignment_service.get_assignment(conn, classroom_id, assignment_id, current_user["id"])


# ── Student: submit assignment (text and/or files) ───────────────────────────

@router.post("/classrooms/{classroom_id}/assignments/{assignment_id}/submit", status_code=status.HTTP_201_CREATED)
async def submit_assignment(
    classroom_id: int,
    assignment_id: int,
    submission_text: Optional[str]    = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return await assignment_service.submit_assignment(
        conn,
        classroom_id=classroom_id,
        assignment_id=assignment_id,
        student_id=current_user["id"],
        submission_text=submission_text,
        files=files or [],
    )


# ── Student: view own submission ─────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/assignments/{assignment_id}/my-submission")
def get_my_submission(
    classroom_id: int,
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return assignment_service.get_my_submission(conn, classroom_id, assignment_id, current_user["id"])


# ── Teacher: view all submissions ────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/assignments/{assignment_id}/submissions")
def get_all_submissions(
    classroom_id: int,
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return assignment_service.get_all_submissions(conn, classroom_id, assignment_id, current_user["id"])


# ── Teacher: grade a submission ──────────────────────────────────────────────

@router.put("/classrooms/{classroom_id}/assignments/{assignment_id}/submissions/{student_id}/grade")
def grade_submission(
    classroom_id: int,
    assignment_id: int,
    student_id: int,
    body: GradeSubmissionInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return assignment_service.grade_submission(
        conn,
        classroom_id=classroom_id,
        assignment_id=assignment_id,
        student_id=student_id,
        owner_id=current_user["id"],
        marks_obtained=body.marks_obtained,
        feedback=body.feedback,
    )