from typing import Optional
from pydantic import BaseModel, field_validator


class CreatePostInput(BaseModel):
    title: str
    content: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("title cannot be blank")
        return v


class UpdatePostInput(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("title", mode="before")
    @classmethod
    def title_not_empty(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("title cannot be blank")
        return v


class CreateCommentInput(BaseModel):
    content: str
    parent_id: Optional[int] = None

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("content cannot be blank")
        return v


class UpdateCommentInput(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("content cannot be blank")
        return v