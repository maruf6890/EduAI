import random
import string

from fastapi import HTTPException, status


def _generate_join_code(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def _unique_join_code(conn) -> str:
    while True:
        code = _generate_join_code()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM classrooms WHERE join_code = %s", (code,))
            if not cur.fetchone():
                return code


def _serialize(row: dict) -> dict:
    row = dict(row)
    if row.get("created_at"):
        row["created_at"] = row["created_at"].isoformat()
    if row.get("updated_at"):
        row["updated_at"] = row["updated_at"].isoformat()
    return row


def create_classroom(conn, owner_id, name, course_code, course_title, description, semester) -> dict:
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

    return {
        "success": True,
        "message": "Classroom created successfully",
        "data": _serialize(classroom),
    }


def get_my_classrooms(conn, owner_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.name, c.join_code, c.course_code, c.course_title,
                   c.description, c.semester, c.owner_id, c.is_active, c.created_at, c.updated_at, u.full_name as owner_name
            FROM classrooms c
            join users u ON c.owner_id = u.id
            WHERE c.owner_id = %s
            ORDER BY c.created_at DESC
            """,
            (owner_id,),
        )
        rows = cur.fetchall()

    return {
        "success": True,
        "message": "Classrooms fetched successfully",
        "data": [_serialize(r) for r in rows],
    }


def get_classroom(conn, classroom_id: int, owner_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.name, c.join_code, c.course_code, c.course_title,
                   c.description, c.semester, c.owner_id, c.is_active, c.created_at, c.updated_at, u.full_name as owner_name
            FROM classrooms c
            join users u ON c.owner_id = u.id
            WHERE c.id = %s
            """,
            (classroom_id,),
        )
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "success": True,
        "message": "Classroom fetched successfully",
        "data": _serialize(classroom),
    }


def update_classroom(conn, classroom_id, owner_id, name, course_code, course_title, description, semester, is_active) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if row["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

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

    return {
        "success": True,
        "message": "Classroom updated successfully",
        "data": _serialize(classroom),
    }


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

    return {
        "success": True,
        "message": "Classroom deleted successfully",
        "data": None,
    }


def regenerate_join_code(conn, classroom_id: int, owner_id: int) -> dict:
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

    return {
        "success": True,
        "message": "Join code regenerated successfully",
        "data": {"join_code": updated["join_code"]},
    }


def get_join_code(conn, classroom_id: int, owner_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id, join_code FROM classrooms WHERE id = %s", (classroom_id,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if row["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "success": True,
        "message": "Join code fetched successfully",
        "data": {"join_code": row["join_code"]},
    }