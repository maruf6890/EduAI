from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.auth import (
    ChangePasswordInput,
    LoginInput,
    RefreshTokenInput,
    RegisterInput,
    UpdateProfileInput,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterInput, conn=Depends(get_db)):
    return auth_service.register(conn, body.email, body.full_name, body.password)


@router.post("/login")
def login(body: LoginInput, conn=Depends(get_db)):
    return auth_service.login(conn, body.email, body.password)


@router.post("/refresh")
def refresh(body: RefreshTokenInput, conn=Depends(get_db)):
    return auth_service.refresh(conn, body.refresh_token)


@router.post("/logout")
def logout(body: RefreshTokenInput, conn=Depends(get_db)):
    return auth_service.logout(conn, body.refresh_token)



@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


@router.put("/me")
def update_profile(
    body: UpdateProfileInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return auth_service.update_profile(conn, current_user["id"], body.full_name)


@router.put("/change-password")
def change_password(
    body: ChangePasswordInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return auth_service.change_password(conn, current_user["id"], body.current_password, body.new_password)
