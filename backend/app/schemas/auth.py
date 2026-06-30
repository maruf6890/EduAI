from pydantic import BaseModel, EmailStr, field_validator


class RegisterInput(BaseModel):
    email: EmailStr
    full_name: str
    password: str

    @field_validator("full_name")
    @classmethod
    def name_valid(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("full_name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenInput(BaseModel):
    refresh_token: str


class UpdateProfileInput(BaseModel):
    full_name: str

    @field_validator("full_name")
    @classmethod
    def name_valid(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("full_name cannot be blank")
        return v


class ChangePasswordInput(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError("new_password must be at least 8 characters")
        return v
