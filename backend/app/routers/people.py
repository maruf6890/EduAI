from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.services.people_service import get_classroom_people

router = APIRouter(prefix="/classrooms/{classroom_id}/people", tags=["People"])

@router.get("/")
def get_people(classroom_id: str, db: Session = Depends(get_db)):
    return get_classroom_people(db, classroom_id)