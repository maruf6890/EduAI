from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.discussion import (
    CreateCommentInput,
    CreatePostInput,
    UpdateCommentInput,
    UpdatePostInput,
)
from app.services import discussion_service

router = APIRouter(tags=["Discussions"])


# ── Teacher: manage posts ─────────────────────────────────────────────────────

@router.post("/classrooms/{classroom_id}/discussions", status_code=status.HTTP_201_CREATED)
def create_post(
    classroom_id: int,
    body: CreatePostInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.create_post(
        conn,
        classroom_id=classroom_id,
        created_by=current_user["id"],
        title=body.title,
        content=body.content,
    )


@router.put("/classrooms/{classroom_id}/discussions/{post_id}")
def update_post(
    classroom_id: int,
    post_id: int,
    body: UpdatePostInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.update_post(
        conn,
        classroom_id=classroom_id,
        post_id=post_id,
        owner_id=current_user["id"],
        title=body.title,
        content=body.content,
        is_active=body.is_active,
    )


@router.delete("/classrooms/{classroom_id}/discussions/{post_id}")
def delete_post(
    classroom_id: int,
    post_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.delete_post(conn, classroom_id, post_id, current_user["id"])


# ── Anyone: view posts ────────────────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/discussions")
def get_posts(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.get_posts(conn, classroom_id, current_user["id"])


@router.get("/classrooms/{classroom_id}/discussions/{post_id}")
def get_post(
    classroom_id: int,
    post_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.get_post(conn, classroom_id, post_id, current_user["id"])


# ── Anyone: comments and replies ─────────────────────────────────────────────

@router.post("/classrooms/{classroom_id}/discussions/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def create_comment(
    classroom_id: int,
    post_id: int,
    body: CreateCommentInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.create_comment(
        conn,
        classroom_id=classroom_id,
        post_id=post_id,
        user_id=current_user["id"],
        content=body.content,
        parent_id=body.parent_id,
    )


@router.put("/classrooms/{classroom_id}/discussions/{post_id}/comments/{comment_id}")
def update_comment(
    classroom_id: int,
    post_id: int,
    comment_id: int,
    body: UpdateCommentInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.update_comment(
        conn,
        classroom_id=classroom_id,
        comment_id=comment_id,
        user_id=current_user["id"],
        content=body.content,
    )


@router.delete("/classrooms/{classroom_id}/discussions/{post_id}/comments/{comment_id}")
def delete_comment(
    classroom_id: int,
    post_id: int,
    comment_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return discussion_service.delete_comment(
        conn,
        classroom_id=classroom_id,
        post_id=post_id,
        comment_id=comment_id,
        user_id=current_user["id"],
    )