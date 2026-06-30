from fastapi import HTTPException, status


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    row = dict(row)
    for field in ("created_at", "updated_at", "uploaded_at"):
        if row.get(field):
            row[field] = row[field].isoformat()
    return row


def _verify_owner(conn, classroom_id: int, user_id: int):
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["owner_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the classroom owner can do this")


def _verify_enrolled(conn, classroom_id: int, student_id: int):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM enrollments WHERE classroom_id = %s AND student_id = %s AND status = 'ACTIVE'",
            (classroom_id, student_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this classroom")


def _get_files(conn, announcement_id: int) -> list:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, file_name, file_url, file_type, uploaded_at
            FROM announcement_files
            WHERE announcement_id = %s
            ORDER BY uploaded_at ASC
            """,
            (announcement_id,),
        )
        return [_serialize(dict(r)) for r in cur.fetchall()]


# ── Teacher: create announcement + optional files ────────────────────────────

async def create_announcement(
    conn,
    classroom_id: int,
    created_by: int,
    title: str,
    content,
    files: list,
) -> dict:
    _verify_owner(conn, classroom_id, created_by)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO announcements (classroom_id, title, content, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id, classroom_id, title, content, created_by, is_active, created_at, updated_at
            """,
            (classroom_id, title, content, created_by),
        )
        announcement = _serialize(dict(cur.fetchone()))

    uploaded_files = []
    if files:
        from app.utils.cloudinary import upload_file_to_cloudinary
        for file in files:
            if not file.filename:
                continue
            file_data = await upload_file_to_cloudinary(
                file,
                folder=f"ai_classroom/announcements/{announcement['id']}",
            )
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO announcement_files (announcement_id, file_name, file_url, file_type)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, file_name, file_url, file_type, uploaded_at
                    """,
                    (announcement["id"], file_data["original_filename"], file_data["url"], file_data["file_type"]),
                )
                uploaded_files.append(_serialize(dict(cur.fetchone())))

    announcement["files"] = uploaded_files

    return {
        "success": True,
        "message": "Announcement created successfully",
        "data": announcement,
    }


# ── Teacher: update announcement ─────────────────────────────────────────────

def update_announcement(
    conn,
    classroom_id: int,
    announcement_id: int,
    owner_id: int,
    title,
    content,
    is_active,
) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    updates = {}
    if title is not None:
        updates["title"] = title
    if content is not None:
        updates["content"] = content
    if is_active is not None:
        updates["is_active"] = is_active

    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [announcement_id, classroom_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE announcements
            SET {set_clause}, updated_at = NOW()
            WHERE id = %s AND classroom_id = %s
            RETURNING id, classroom_id, title, content, created_by, is_active, created_at, updated_at
            """,
            values,
        )
        announcement = cur.fetchone()

    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    announcement = _serialize(dict(announcement))
    announcement["files"] = _get_files(conn, announcement["id"])

    return {
        "success": True,
        "message": "Announcement updated successfully",
        "data": announcement,
    }


# ── Teacher: delete announcement ──────────────────────────────────────────────

def delete_announcement(conn, classroom_id: int, announcement_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM announcements WHERE id = %s AND classroom_id = %s RETURNING id",
            (announcement_id, classroom_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    return {
        "success": True,
        "message": "Announcement deleted successfully",
        "data": None,
    }


# ── Teacher: get all announcements (active + inactive) ───────────────────────

def get_all_announcements_teacher(conn, classroom_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, content, created_by, is_active, created_at, updated_at
            FROM announcements
            WHERE classroom_id = %s
            ORDER BY created_at DESC
            """,
            (classroom_id,),
        )
        rows = cur.fetchall()

    announcements = []
    for r in rows:
        a = _serialize(dict(r))
        a["files"] = _get_files(conn, a["id"])
        announcements.append(a)

    return {
        "success": True,
        "message": "Announcements fetched successfully",
        "data": announcements,
    }


# ── Student: get only active announcements ────────────────────────────────────

def get_active_announcements_student(conn, classroom_id: int, student_id: int) -> dict:
    _verify_enrolled(conn, classroom_id, student_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, content, created_by, is_active, created_at, updated_at
            FROM announcements
            WHERE classroom_id = %s AND is_active = TRUE
            ORDER BY created_at DESC
            """,
            (classroom_id,),
        )
        rows = cur.fetchall()

    announcements = []
    for r in rows:
        a = _serialize(dict(r))
        a["files"] = _get_files(conn, a["id"])
        announcements.append(a)

    return {
        "success": True,
        "message": "Announcements fetched successfully",
        "data": announcements,
    }


# ── Get single announcement ───────────────────────────────────────────────────

def get_announcement(conn, classroom_id: int, announcement_id: int, user_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    is_owner = classroom["owner_id"] == user_id
    if not is_owner:
        _verify_enrolled(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, content, created_by, is_active, created_at, updated_at
            FROM announcements
            WHERE id = %s AND classroom_id = %s
            """,
            (announcement_id, classroom_id),
        )
        announcement = cur.fetchone()

    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    # Students can only see active announcements
    if not is_owner and not announcement["is_active"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    announcement = _serialize(dict(announcement))
    announcement["files"] = _get_files(conn, announcement["id"])

    return {
        "success": True,
        "message": "Announcement fetched successfully",
        "data": announcement,
    }