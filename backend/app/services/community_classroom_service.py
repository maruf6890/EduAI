import re

import psycopg2
from fastapi import HTTPException, status


# ── Helpers ──────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def _serialize(row: dict) -> dict:
    row = dict(row)
    if row.get("created_at"):
        row["created_at"] = row["created_at"].isoformat()
    if row.get("updated_at"):
        row["updated_at"] = row["updated_at"].isoformat()
    return row


_SELECT_FIELDS = """
    id, name, join_code, course_code, course_title, description,
    semester, owner_id, is_active, classroom_type, topic_slug,
    created_at, updated_at
"""


# ── Search related community classrooms (plain text match — no AI yet) ───────

def search_community_classrooms(conn, topic: str) -> list:
    slug = _slugify(topic)
    like_pattern = f"%{topic.strip()}%"

    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT {_SELECT_FIELDS}
            FROM classrooms
            WHERE classroom_type = 'COMMUNITY'
              AND is_active = TRUE
              AND (
                    topic_slug = %s
                    OR topic_slug ILIKE %s
                    OR name ILIKE %s
                    OR course_title ILIKE %s
                  )
            ORDER BY created_at DESC
            """,
            (slug, f"%{slug}%", like_pattern, like_pattern),
        )
        rows = cur.fetchall()

    return [_serialize(dict(r)) for r in rows]


# ── Create a new community classroom ──────────────────────────────────────────

def create_community_classroom(conn, topic: str, description) -> dict:
    slug = _slugify(topic)
    title = topic.strip()

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO classrooms
                    (name, course_title, description, classroom_type, topic_slug,
                     owner_id, join_code, course_code)
                VALUES (%s, %s, %s, 'COMMUNITY', %s, NULL, NULL, NULL)
                RETURNING {_SELECT_FIELDS}
                """,
                (title, title, description, slug),
            )
            classroom = cur.fetchone()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A community classroom for this topic was just created. Please search again.",
        )

    return _serialize(dict(classroom))


# ── Find or create — main entry point (used by chatbot flow later) ───────────

def find_or_create_community_classroom(conn, topic: str, description) -> dict:
    matches = search_community_classrooms(conn, topic)

    if matches:
        return {
            "success": True,
            "message": "Related community classrooms found",
            "data": {
                "created": False,
                "classrooms": matches,
            },
        }

    new_classroom = create_community_classroom(conn, topic, description)

    return {
        "success": True,
        "message": "Community classroom created successfully",
        "data": {
            "created": True,
            "classrooms": [new_classroom],
        },
    }


# ── List all community classrooms (for the community page) ───────────────────
# Optional `topic` filter reuses the same relatedness matching as search.

def get_all_community_classrooms(conn, user_id: int, topic: str | None = None) -> dict:
    if topic:
        slug = _slugify(topic)
        like_pattern = f"%{topic.strip()}%"
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT {_SELECT_FIELDS}
                FROM classrooms
                WHERE classroom_type = 'COMMUNITY'
                  AND is_active = TRUE
                  AND (
                        topic_slug = %s
                        OR topic_slug ILIKE %s
                        OR name ILIKE %s
                        OR course_title ILIKE %s
                      )
                ORDER BY created_at DESC
                """,
                (slug, f"%{slug}%", like_pattern, like_pattern),
            )
            rows = cur.fetchall()
    else:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT {_SELECT_FIELDS}
                FROM classrooms
                WHERE classroom_type = 'COMMUNITY' AND is_active = TRUE
                ORDER BY created_at DESC
                """
            )
            rows = cur.fetchall()

    classroom_ids = [r["id"] for r in rows]
    enrolled_ids = set()

    if classroom_ids:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT classroom_id FROM enrollments
                WHERE student_id = %s AND status = 'ACTIVE' AND classroom_id = ANY(%s)
                """,
                (user_id, classroom_ids),
            )
            enrolled_ids = {row["classroom_id"] for row in cur.fetchall()}

    classrooms = []
    for r in rows:
        c = _serialize(dict(r))
        c["has_teacher"] = c["owner_id"] is not None
        if c["owner_id"] == user_id:
            c["role"] = "teacher"
        elif r["id"] in enrolled_ids:
            c["role"] = "student"
        else:
            c["role"] = None
        classrooms.append(c)

    return {
        "success": True,
        "message": "Community classrooms fetched successfully",
        "data": classrooms,
    }


# ── Get single community classroom — open to any authenticated user ──────────

def get_community_classroom(conn, classroom_id: int, user_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT {_SELECT_FIELDS}
            FROM classrooms
            WHERE id = %s AND classroom_type = 'COMMUNITY'
            """,
            (classroom_id,),
        )
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community classroom not found")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT status FROM enrollments WHERE classroom_id = %s AND student_id = %s",
            (classroom_id, user_id),
        )
        enrollment = cur.fetchone()

    data = _serialize(dict(classroom))
    data["has_teacher"] = data["owner_id"] is not None

    if data["owner_id"] == user_id:
        data["role"] = "teacher"
    elif enrollment and enrollment["status"] == "ACTIVE":
        data["role"] = "student"
    else:
        data["role"] = None

    return {
        "success": True,
        "message": "Community classroom fetched successfully",
        "data": data,
    }


# ── Join as teacher — first-come, race-safe ───────────────────────────────────

def join_as_teacher(conn, classroom_id: int, user_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, owner_id, classroom_type, is_active FROM classrooms WHERE id = %s",
            (classroom_id,),
        )
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["classroom_type"] != "COMMUNITY":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a community classroom")

    if not classroom["is_active"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This classroom is no longer active")

    if classroom["owner_id"] is not None:
        if classroom["owner_id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already the teacher of this classroom",
            )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This classroom already has a teacher")

    # Race-safe: only succeeds if owner_id is still NULL at update time
    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE classrooms SET owner_id = %s, updated_at = NOW()
            WHERE id = %s AND owner_id IS NULL
            RETURNING {_SELECT_FIELDS}
            """,
            (user_id, classroom_id),
        )
        updated = cur.fetchone()

    if not updated:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This classroom already has a teacher")

    data = _serialize(dict(updated))
    data["role"] = "teacher"
    data["has_teacher"] = True

    return {
        "success": True,
        "message": "You are now the teacher of this classroom",
        "data": data,
    }


# ── Join as student ────────────────────────────────────────────────────────────

def join_as_student(conn, classroom_id: int, student_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, name, course_title, owner_id, is_active, classroom_type FROM classrooms WHERE id = %s",
            (classroom_id,),
        )
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["classroom_type"] != "COMMUNITY":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a community classroom")

    if not classroom["is_active"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This classroom is no longer active")

    if classroom["owner_id"] == student_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are the teacher of this classroom")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status FROM enrollments WHERE classroom_id = %s AND student_id = %s",
            (classroom_id, student_id),
        )
        existing = cur.fetchone()

    if existing:
        if existing["status"] == "ACTIVE":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already joined this classroom")

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE enrollments SET status = 'ACTIVE', joined_at = NOW()
                WHERE classroom_id = %s AND student_id = %s
                RETURNING id, classroom_id, student_id, joined_at, status
                """,
                (classroom_id, student_id),
            )
            enrollment = cur.fetchone()
    else:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO enrollments (classroom_id, student_id)
                VALUES (%s, %s)
                RETURNING id, classroom_id, student_id, joined_at, status
                """,
                (classroom_id, student_id),
            )
            enrollment = cur.fetchone()

    enrollment = dict(enrollment)
    if enrollment.get("joined_at"):
        enrollment["joined_at"] = enrollment["joined_at"].isoformat()

    return {
        "success": True,
        "message": "Joined community classroom successfully",
        "data": {
            "enrollment": enrollment,
            "classroom": {
                "id": classroom["id"],
                "name": classroom["name"],
                "course_title": classroom["course_title"],
            },
        },
    }