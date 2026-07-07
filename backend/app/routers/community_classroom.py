from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.services import community_classroom_service

router = APIRouter(prefix="/community-classrooms", tags=["Community Classrooms"])


# ── List all community classrooms — optional ?topic= filter ──────────────────

@router.get("")
def get_all_community_classrooms(
    topic: Optional[str] = Query(None, min_length=1),
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return community_classroom_service.get_all_community_classrooms(
        conn,
        current_user["id"],
        topic=topic,
    )


# ── Get single community classroom — open to any authenticated user ──────────

@router.get("/{classroom_id}")
def get_community_classroom(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return community_classroom_service.get_community_classroom(conn, classroom_id, current_user["id"])


# ── Join as teacher ────────────────────────────────────────────────────────────

@router.post("/{classroom_id}/join-as-teacher")
def join_as_teacher(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return community_classroom_service.join_as_teacher(conn, classroom_id, current_user["id"])


# ── Join as student ────────────────────────────────────────────────────────────

@router.post("/{classroom_id}/join-as-student")
def join_as_student(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return community_classroom_service.join_as_student(conn, classroom_id, current_user["id"])