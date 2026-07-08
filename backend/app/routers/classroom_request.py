from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.classroom_request import CreateClassroomRequestInput
from app.services import classroom_request_service

router = APIRouter(prefix="/classroom-requests", tags=["Classroom Requests"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_classroom_request(
    body: CreateClassroomRequestInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_request_service.create_classroom_request(
        conn,
        user_id=current_user["id"],
        title=body.title,
        description=body.description,
    )
    


@router.get("/my")
def get_my_classroom_requests(
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return classroom_request_service.get_my_classroom_requests(conn, current_user["id"])