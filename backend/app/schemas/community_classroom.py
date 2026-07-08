from typing import Optional
from pydantic import BaseModel, field_validator


class FindOrCreateCommunityClassroomInput(BaseModel):
    topic: str
    description: Optional[str] = None

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("topic cannot be blank")
        return v