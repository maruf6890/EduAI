from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.announcement import UpdateAnnouncementInput
from app.services import announcement_service

router = APIRouter(tags=["Announcements"])


# ── Teacher: create announcement + optional files in one request ─────────────

@router.post("/classrooms/{classroom_id}/announcements", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    classroom_id: int,
    title: str                      = Form(...),
    content: Optional[str]          = Form(None),
    files: List[UploadFile]         = File(default=[]),
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return await announcement_service.create_announcement(
        conn,
        classroom_id=classroom_id,
        created_by=current_user["id"],
        title=title,
        content=content,
        files=files,
    )


# ── Teacher: update announcement ─────────────────────────────────────────────

@router.put("/classrooms/{classroom_id}/announcements/{announcement_id}")
def update_announcement(
    classroom_id: int,
    announcement_id: int,
    body: UpdateAnnouncementInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return announcement_service.update_announcement(
        conn,
        classroom_id=classroom_id,
        announcement_id=announcement_id,
        owner_id=current_user["id"],
        title=body.title,
        content=body.content,
        is_active=body.is_active,
    )


# ── Teacher: delete announcement ─────────────────────────────────────────────

@router.delete("/classrooms/{classroom_id}/announcements/{announcement_id}")
def delete_announcement(
    classroom_id: int,
    announcement_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return announcement_service.delete_announcement(conn, classroom_id, announcement_id, current_user["id"])


# ── Teacher: list all announcements (active + inactive) ──────────────────────

@router.get("/classrooms/{classroom_id}/announcements/teacher")
def get_all_announcements_teacher(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return announcement_service.get_all_announcements_teacher(conn, classroom_id, current_user["id"])


# ── Student: list only active announcements ───────────────────────────────────

@router.get("/classrooms/{classroom_id}/announcements/student")
def get_active_announcements_student(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return announcement_service.get_active_announcements_student(conn, classroom_id, current_user["id"])


# ── Get single announcement ───────────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/announcements/{announcement_id}")
def get_announcement(
    classroom_id: int,
    announcement_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return announcement_service.get_announcement(conn, classroom_id, announcement_id, current_user["id"])