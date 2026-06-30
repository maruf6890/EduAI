from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.enrollment import JoinClassroomInput
from app.services import enrollment_service

router = APIRouter(tags=["Enrollments"])


# Student joins a classroom using join code
@router.post("/enrollments/join", status_code=status.HTTP_201_CREATED)
def join_classroom(
    body: JoinClassroomInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return enrollment_service.join_classroom(conn, current_user["id"], body.join_code)


# Student leaves a classroom
@router.delete("/enrollments/leave/{classroom_id}")
def leave_classroom(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return enrollment_service.leave_classroom(conn, current_user["id"], classroom_id)


# Student sees all classrooms they joined
@router.get("/enrollments/my-classrooms")
def my_enrolled_classrooms(
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return enrollment_service.get_my_enrolled_classrooms(conn, current_user["id"])


# Owner sees all students in their classroom
@router.get("/classrooms/{classroom_id}/students")
def get_classroom_students(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return enrollment_service.get_classroom_students(conn, classroom_id, current_user["id"])


# Owner removes a student from their classroom
@router.delete("/classrooms/{classroom_id}/students/{student_id}")
def remove_student(
    classroom_id: int,
    student_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return enrollment_service.remove_student(conn, classroom_id, student_id, current_user["id"])