from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator


class CreatePersonalTaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    classroom_id: Optional[int] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("title cannot be blank")
        return v


class UpdatePersonalTaskInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None

    @field_validator("title", mode="before")
    @classmethod
    def title_not_empty(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("title cannot be blank")
        return v
    