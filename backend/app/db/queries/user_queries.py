"""
All raw SQL queries for the users table.
Accepts a psycopg2 connection; returns plain dicts or None.
"""


def get_user_by_email(conn, email: str) -> dict | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, email, full_name, password_hash, is_active, created_at, updated_at
            FROM users
            WHERE email = %s
            """,
            (email,),
        )
        return cur.fetchone()


def get_user_by_id(conn, user_id: int) -> dict | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, email, full_name, is_active, created_at, updated_at
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )
        return cur.fetchone()


def create_user(conn, email: str, full_name: str, password_hash: str) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (email, full_name, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, email, full_name, is_active, created_at
            """,
            (email, full_name, password_hash),
        )
        return cur.fetchone()


def store_refresh_token(conn, user_id: int, token: str, expires_at) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES (%s, %s, %s)
            """,
            (user_id, token, expires_at),
        )


def get_refresh_token(conn, token: str) -> dict | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, token, expires_at, revoked
            FROM refresh_tokens
            WHERE token = %s
            """,
            (token,),
        )
        return cur.fetchone()


def revoke_refresh_token(conn, token: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE refresh_tokens
            SET revoked = TRUE
            WHERE token = %s
            """,
            (token,),
        )


def revoke_all_user_tokens(conn, user_id: int) -> None:
    """Used on logout-all-devices."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE refresh_tokens
            SET revoked = TRUE
            WHERE user_id = %s AND revoked = FALSE
            """,
            (user_id,),
        )


def update_user_profile(conn, user_id: int, full_name: str) -> dict | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE users
            SET full_name = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, email, full_name, is_active, created_at, updated_at
            """,
            (full_name, user_id),
        )
        return cur.fetchone()


def update_user_password(conn, user_id: int, new_password_hash: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE users
            SET password_hash = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (new_password_hash, user_id),
        )


def get_user_by_id_with_hash(conn, user_id: int) -> dict | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, email, full_name, password_hash, is_active, created_at, updated_at
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )
        return cur.fetchone()
