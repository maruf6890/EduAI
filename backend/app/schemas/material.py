from typing import Optional
from pydantic import BaseModel, field_validator


class UpdateMaterialInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

    @field_validator("title", mode="before")
    @classmethod
    def title_not_empty(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("title cannot be blank")
        return v
    