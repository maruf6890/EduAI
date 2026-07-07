from typing import Optional
from pydantic import BaseModel, field_validator


class CreateClassroomRequestInput(BaseModel):
    title: str
    description: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("title cannot be blank")
        return v