from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import null

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def register(conn, email: str, full_name: str, password: str) -> dict:
    print(f"Registering user with email: {email}")
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        cur.execute(
            """
            INSERT INTO users (email, full_name, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, email, full_name, is_active, created_at
            """,
            (email, full_name, hash_password(password)),
        )
        user = dict(cur.fetchone())

    access_token = create_access_token(user["id"])
    refresh_token = create_refresh_token(user["id"])
    _store_refresh_token(conn, user["id"], refresh_token)

    return {
    "success": True,
    "message": "User registered successfully.",
    "data": {
        "user": {
            **user,
            "created_at": user["created_at"].isoformat(),
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    },
}


def login(conn, email: str, password: str) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, email, full_name, password_hash, is_active, created_at FROM users WHERE email = %s",
            (email,),
        )
        user = cur.fetchone()

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user["is_active"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    user = dict(user)
    access_token = create_access_token(user["id"])
    refresh_token = create_refresh_token(user["id"])
    _store_refresh_token(conn, user["id"], refresh_token)

    return {
    "success": True,
    "message": "Login successful.",
    "data": {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "is_active": user["is_active"],
            "created_at": user["created_at"].isoformat(),
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    },
}


def refresh(conn, refresh_token: str) -> dict:
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE token = %s",
            (refresh_token,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not found")

    if row["revoked"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")

    expires_at = row["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")

    return {
    "success": True,
    "message": "Token refreshed successfully.",
    "data": {
        "access_token": create_access_token(row["user_id"]),
        "token_type": "bearer",
    },
}


def logout(conn, refresh_token: str) -> dict:
    with conn.cursor() as cur:
        cur.execute("UPDATE refresh_tokens SET revoked = TRUE WHERE token = %s", (refresh_token,))
    return {
        "success": True,
        "message": "Logged out successfully.",
        "data": null
    }





def update_profile(conn, user_id: int, full_name: str) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE users SET full_name = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, email, full_name, is_active, created_at, updated_at
            """,
            (full_name, user_id),
        )
        user = dict(cur.fetchone())

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "data": {
            "user": {
                **user,
                "created_at": user["created_at"].isoformat(),
                "updated_at": user["updated_at"].isoformat(),
            }
        }
    }


def change_password(conn, user_id: int, current_password: str, new_password: str) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()

    if not verify_password(current_password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    with conn.cursor() as cur:
        cur.execute(
            "UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s",
            (hash_password(new_password), user_id),
        )
        # Revoke all sessions so other devices are logged out
        cur.execute(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = %s AND revoked = FALSE",
            (user_id,),
        )

    return {
        "success": True,
        "message": "Password changed. Please log in again.",
        "data": null
    }


# ── Internal helper ──────────────────────────────────────────────────────────

def _store_refresh_token(conn, user_id: int, token: str):
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, token, expires_at),
        )
