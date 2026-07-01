from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, field_validator


class QuestionInput(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: str
    marks: int = 1
    order_index: int = 0

    @field_validator("correct_option")
    @classmethod
    def valid_option(cls, v):
        v = v.upper()
        if v not in ("A", "B", "C", "D"):
            raise ValueError("correct_option must be A, B, C or D")
        return v

    @field_validator("marks")
    @classmethod
    def marks_positive(cls, v):
        if v <= 0:
            raise ValueError("marks must be positive")
        return v


class CreateQuizInput(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: int = 30
    is_published: bool = False
    questions: List[QuestionInput] = []

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("title cannot be blank")
        return v

    @field_validator("duration_minutes")
    @classmethod
    def duration_positive(cls, v):
        if v <= 0:
            raise ValueError("duration_minutes must be positive")
        return v


class UpdateQuizInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    is_published: Optional[bool] = None

    @field_validator("title", mode="before")
    @classmethod
    def title_not_empty(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("title cannot be blank")
        return v


class AnswerInput(BaseModel):
    question_id: int
    selected_option: str

    @field_validator("selected_option")
    @classmethod
    def valid_option(cls, v):
        v = v.upper()
        if v not in ("A", "B", "C", "D"):
            raise ValueError("selected_option must be A, B, C or D")
        return v


class SubmitQuizInput(BaseModel):
    answers: List[AnswerInput]