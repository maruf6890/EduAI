from pydantic import BaseModel, field_validator


class JoinClassroomInput(BaseModel):
    join_code: str

    @field_validator("join_code")
    @classmethod
    def not_empty(cls, v):
        v = v.strip().upper()
        if not v:
            raise ValueError("join_code cannot be blank")
        return v