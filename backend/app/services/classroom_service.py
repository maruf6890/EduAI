import random
import string

from fastapi import HTTPException, status


def _generate_join_code(length: int = 8) -> str:
    """Generate a random alphanumeric join code e.g. 'A3FX92BT'."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def _unique_join_code(conn) -> str:
    """Keep generating until we get one that doesn't exist yet."""
    while True:
        code = _generate_join_code()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM classrooms WHERE join_code = %s", (code,))
            if not cur.fetchone():
                return code


def _serialize(row: dict) -> dict:
    """Convert datetime fields to ISO strings for JSON response."""
    row = dict(row)
    if row.get("created_at"):
        row["created_at"] = row["created_at"].isoformat()
    if row.get("updated_at"):
        row["updated_at"] = row["updated_at"].isoformat()
    return row



def create_classroom(
    conn,
    owner_id: int,
    name: str,
    course_code: str,
    course_title: str,
    description: str | None,
    semester: str | None,
) -> dict:
    join_code = _unique_join_code(conn)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO classrooms
                (name, join_code, course_code, course_title, description, semester, owner_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, name, join_code, course_code, course_title,
                      description, semester, owner_id, is_active, created_at, updated_at
            """,
            (name, join_code, course_code, course_title, description, semester, owner_id),
        )
        classroom = cur.fetchone()

    return {"classroom": _serialize(classroom)}


def get_my_classrooms(conn, owner_id: int) -> dict:
    """All classrooms owned by the current user."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, join_code, course_code, course_title,
                   description, semester, owner_id, is_active, created_at, updated_at
            FROM classrooms
            WHERE owner_id = %s
            ORDER BY created_at DESC
            """,
            (owner_id,),
        )
        rows = cur.fetchall()

    return {"classrooms": [_serialize(r) for r in rows]}


def get_classroom(conn, classroom_id: int, owner_id: int) -> dict:
    """Get a single classroom — only the owner can view it."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, join_code, course_code, course_title,
                   description, semester, owner_id, is_active, created_at, updated_at
            FROM classrooms
            WHERE id = %s
            """,
            (classroom_id,),
        )
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {"classroom": _serialize(classroom)}


def update_classroom(
    conn,
    classroom_id: int,
    owner_id: int,
    name: str | None,
    course_code: str | None,
    course_title: str | None,
    description: str | None,
    semester: str | None,
    is_active: bool | None,
) -> dict:
    # Verify ownership first
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if row["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Build SET clause dynamically from only the fields provided
    fields = {
        "name": name,
        "course_code": course_code,
        "course_title": course_title,
        "description": description,
        "semester": semester,
        "is_active": is_active,
    }
    updates = {k: v for k, v in fields.items() if v is not None}

    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [classroom_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE classrooms
            SET {set_clause}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, name, join_code, course_code, course_title,
                      description, semester, owner_id, is_active, created_at, updated_at
            """,
            values,
        )
        classroom = cur.fetchone()

    return {"classroom": _serialize(classroom)}


def delete_classroom(conn, classroom_id: int, owner_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if row["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    with conn.cursor() as cur:
        cur.execute("DELETE FROM classrooms WHERE id = %s", (classroom_id,))

    return {"message": "Classroom deleted successfully"}


def regenerate_join_code(conn, classroom_id: int, owner_id: int) -> dict:
    """Owner can get a fresh join code anytime."""
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if row["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    new_code = _unique_join_code(conn)

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE classrooms SET join_code = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING join_code
            """,
            (new_code, classroom_id),
        )
        updated = cur.fetchone()

    return {"join_code": updated["join_code"]}