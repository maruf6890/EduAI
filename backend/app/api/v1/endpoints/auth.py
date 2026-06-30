"""
Auth endpoints:
  POST /auth/register
  POST /auth/login
  POST /auth/refresh
  POST /auth/logout
  POST /auth/logout-all
  GET  /auth/me
  PUT  /auth/me
  PUT  /auth/change-password
"""

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user, get_db_connection
from app.schemas.auth import (
    ChangePasswordInput,
    LoginInput,
    RefreshTokenInput,
    RegisterInput,
    UpdateProfileInput,
)
from app.services import auth_service
from app.db.queries import user_queries

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterInput, conn=Depends(get_db_connection)):
    """Register a new user and return tokens."""
    return auth_service.register_user(
        conn,
        email=body.email,
        full_name=body.full_name,
        password=body.password,
    )


@router.post("/login")
def login(body: LoginInput, conn=Depends(get_db_connection)):
    """Login and return access + refresh tokens."""
    return auth_service.login_user(conn, email=body.email, password=body.password)


@router.post("/refresh")
def refresh(body: RefreshTokenInput, conn=Depends(get_db_connection)):
    """Get a new access token using a valid refresh token."""
    return auth_service.refresh_access_token(conn, body.refresh_token)


@router.post("/logout")
def logout(body: RefreshTokenInput, conn=Depends(get_db_connection)):
    """Revoke the given refresh token (logout current device)."""
    return auth_service.logout_user(conn, body.refresh_token)


@router.post("/logout-all")
def logout_all(
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    """Revoke all refresh tokens for the current user (logout all devices)."""
    return auth_service.logout_all_devices(conn, current_user["id"])


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return {"user": current_user}


@router.put("/me")
def update_profile(
    body: UpdateProfileInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    """Update the current user's profile."""
    updated = user_queries.update_user_profile(conn, current_user["id"], body.full_name)
    return {
        "user": {
            "id": updated["id"],
            "email": updated["email"],
            "full_name": updated["full_name"],
            "is_active": updated["is_active"],
            "created_at": updated["created_at"].isoformat() if updated["created_at"] else None,
            "updated_at": updated["updated_at"].isoformat() if updated["updated_at"] else None,
        }
    }


@router.put("/change-password")
def change_password(
    body: ChangePasswordInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    """Change the current user's password and revoke all sessions."""
    return auth_service.change_password(
        conn,
        user_id=current_user["id"],
        current_password=body.current_password,
        new_password=body.new_password,
    )
