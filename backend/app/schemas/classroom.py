from typing import Optional
from pydantic import BaseModel, field_validator


class CreateClassroomInput(BaseModel):
    name: str
    course_code: str
    course_title: str
    description: Optional[str] = None
    semester: Optional[str] = None

    @field_validator("name", "course_code", "course_title")
    @classmethod
    def not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be blank")
        return v


class UpdateClassroomInput(BaseModel):
    name: Optional[str] = None
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    description: Optional[str] = None
    semester: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("name", "course_code", "course_title", mode="before")
    @classmethod
    def not_empty(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be blank")
        return v