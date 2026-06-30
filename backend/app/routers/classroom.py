from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.classroom import CreateClassroomInput, UpdateClassroomInput
from app.services import classroom_service

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_classroom(
    body: CreateClassroomInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_service.create_classroom(
        conn,
        owner_id=current_user["id"],
        name=body.name,
        course_code=body.course_code,
        course_title=body.course_title,
        description=body.description,
        semester=body.semester,
    )


@router.get("")
def get_my_classrooms(
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_service.get_my_classrooms(conn, current_user["id"])


@router.get("/{classroom_id}")
def get_classroom(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_service.get_classroom(conn, classroom_id, current_user["id"])


@router.put("/{classroom_id}")
def update_classroom(
    classroom_id: int,
    body: UpdateClassroomInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_service.update_classroom(
        conn,
        classroom_id=classroom_id,
        owner_id=current_user["id"],
        name=body.name,
        course_code=body.course_code,
        course_title=body.course_title,
        description=body.description,
        semester=body.semester,
        is_active=body.is_active,
    )


@router.delete("/{classroom_id}")
def delete_classroom(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_service.delete_classroom(conn, classroom_id, current_user["id"])


@router.post("/{classroom_id}/regenerate-code")
def regenerate_join_code(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_service.regenerate_join_code(conn, classroom_id, current_user["id"])