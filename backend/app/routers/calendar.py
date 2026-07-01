from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.calendar import CreatePersonalTaskInput, UpdatePersonalTaskInput
from app.services import calendar_service

router = APIRouter(tags=["Calendar"])


# ── Personal task CRUD (any user) ────────────────────────────────────────────

@router.post("/calendar/tasks", status_code=status.HTTP_201_CREATED)
def create_personal_task(
    body: CreatePersonalTaskInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return calendar_service.create_personal_task(
        conn,
        user_id=current_user["id"],
        title=body.title,
        description=body.description,
        event_date=body.event_date,
        classroom_id=body.classroom_id,
    )


@router.put("/calendar/tasks/{event_id}")
def update_personal_task(
    event_id: int,
    body: UpdatePersonalTaskInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return calendar_service.update_personal_task(
        conn,
        event_id=event_id,
        user_id=current_user["id"],
        title=body.title,
        description=body.description,
        event_date=body.event_date,
    )


@router.delete("/calendar/tasks/{event_id}")
def delete_personal_task(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return calendar_service.delete_personal_task(conn, event_id, current_user["id"])


# ── View calendar ─────────────────────────────────────────────────────────────

@router.get("/calendar/my")
def get_my_calendar(
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    """All classroom events + personal tasks across all classrooms."""
    return calendar_service.get_my_calendar(conn, current_user["id"])


@router.get("/classrooms/{classroom_id}/calendar")
def get_classroom_calendar(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    """Classroom events + personal tasks for a specific classroom."""
    return calendar_service.get_classroom_calendar(conn, classroom_id, current_user["id"])