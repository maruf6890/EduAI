from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator


class CreateAssignmentInput(BaseModel):
    title: str
    description: Optional[str] = None
    total_marks: Optional[int] = None
    due_date: Optional[datetime] = None
    allow_late_submission: bool = False
    is_published: bool = False

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("title cannot be blank")
        return v

    @field_validator("total_marks")
    @classmethod
    def marks_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("total_marks must be positive")
        return v


class UpdateAssignmentInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    total_marks: Optional[int] = None
    due_date: Optional[datetime] = None
    allow_late_submission: Optional[bool] = None
    is_published: Optional[bool] = None

    @field_validator("title", mode="before")
    @classmethod
    def title_not_empty(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("title cannot be blank")
        return v

    @field_validator("total_marks")
    @classmethod
    def marks_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("total_marks must be positive")
        return v


class GradeSubmissionInput(BaseModel):
    marks_obtained: float
    feedback: Optional[str] = None

    @field_validator("marks_obtained")
    @classmethod
    def marks_non_negative(cls, v):
        if v < 0:
            raise ValueError("marks_obtained cannot be negative")
        return v