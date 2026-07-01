from fastapi import HTTPException, status


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    row = dict(row)
    for field in ("created_at", "updated_at", "uploaded_at"):
        if row.get(field):
            row[field] = row[field].isoformat()
    return row


def _get_classroom(conn, classroom_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT id, owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    return dict(classroom)


def _verify_enrolled(conn, classroom_id: int, student_id: int):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM enrollments WHERE classroom_id = %s AND student_id = %s AND status = 'ACTIVE'",
            (classroom_id, student_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this classroom")


def _verify_member(conn, classroom_id: int, user_id: int) -> bool:
    """Returns True if owner, False if enrolled student, raises if neither."""
    classroom = _get_classroom(conn, classroom_id)
    if classroom["owner_id"] == user_id:
        return True
    _verify_enrolled(conn, classroom_id, user_id)
    return False


def _get_files(conn, material_id: int) -> list:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, file_name, file_url, file_type, uploaded_at
            FROM material_files
            WHERE material_id = %s
            ORDER BY uploaded_at ASC
            """,
            (material_id,),
        )
        return [_serialize(dict(r)) for r in cur.fetchall()]


# ── Upload material + files ───────────────────────────────────────────────────

async def upload_material(
    conn,
    classroom_id: int,
    uploaded_by: int,
    title: str,
    description,
    visibility: str,
    files: list,
) -> dict:
    classroom = _get_classroom(conn, classroom_id)
    is_owner = classroom["owner_id"] == uploaded_by

    if not is_owner:
        _verify_enrolled(conn, classroom_id, uploaded_by)

    # Only teacher can upload CENTRAL materials
    if visibility == "CENTRAL" and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the teacher can upload central materials",
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file is required",
        )

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO materials (classroom_id, title, description, visibility, uploaded_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, classroom_id, title, description, visibility, uploaded_by, created_at, updated_at
            """,
            (classroom_id, title, description, visibility, uploaded_by),
        )
        material = _serialize(dict(cur.fetchone()))

    from app.utils.cloudinary import upload_file_to_cloudinary
    uploaded_files = []
    for file in files:
        if not file.filename:
            continue
        file_data = await upload_file_to_cloudinary(
            file,
            folder=f"ai_classroom/materials/{visibility.lower()}/{material['id']}",
        )
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO material_files (material_id, file_name, file_url, file_type)
                VALUES (%s, %s, %s, %s)
                RETURNING id, file_name, file_url, file_type, uploaded_at
                """,
                (material["id"], file_data["original_filename"], file_data["url"], file_data["file_type"]),
            )
            uploaded_files.append(_serialize(dict(cur.fetchone())))

    material["files"] = uploaded_files

    return {
        "success": True,
        "message": "Material uploaded successfully",
        "data": material,
    }


# ── Update material info ──────────────────────────────────────────────────────

def update_material(conn, classroom_id: int, material_id: int, user_id: int, title, description) -> dict:
    _verify_member(conn, classroom_id, user_id)

    # Only the uploader can update
    with conn.cursor() as cur:
        cur.execute("SELECT uploaded_by FROM materials WHERE id = %s AND classroom_id = %s", (material_id, classroom_id))
        material = cur.fetchone()

    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    if material["uploaded_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own materials")

    updates = {}
    if title is not None:
        updates["title"] = title
    if description is not None:
        updates["description"] = description

    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [material_id, classroom_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE materials SET {set_clause}, updated_at = NOW()
            WHERE id = %s AND classroom_id = %s
            RETURNING id, classroom_id, title, description, visibility, uploaded_by, created_at, updated_at
            """,
            values,
        )
        updated = _serialize(dict(cur.fetchone()))

    updated["files"] = _get_files(conn, updated["id"])

    return {
        "success": True,
        "message": "Material updated successfully",
        "data": updated,
    }


# ── Delete material ───────────────────────────────────────────────────────────

def delete_material(conn, classroom_id: int, material_id: int, user_id: int) -> dict:
    classroom = _get_classroom(conn, classroom_id)
    is_owner = classroom["owner_id"] == user_id

    if not is_owner:
        _verify_enrolled(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            "SELECT uploaded_by FROM materials WHERE id = %s AND classroom_id = %s",
            (material_id, classroom_id),
        )
        material = cur.fetchone()

    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    # Teacher can delete any central material, others can only delete their own
    if material["uploaded_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own materials")

    with conn.cursor() as cur:
        cur.execute("DELETE FROM materials WHERE id = %s", (material_id,))

    return {
        "success": True,
        "message": "Material deleted successfully",
        "data": None,
    }


# ── Get central materials (visible to everyone) ───────────────────────────────

def get_central_materials(conn, classroom_id: int, user_id: int) -> dict:
    _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                m.id, m.classroom_id, m.title, m.description,
                m.visibility, m.uploaded_by, m.created_at, m.updated_at,
                u.full_name AS uploader_name
            FROM materials m
            JOIN users u ON u.id = m.uploaded_by
            WHERE m.classroom_id = %s AND m.visibility = 'CENTRAL'
            ORDER BY m.created_at DESC
            """,
            (classroom_id,),
        )
        rows = cur.fetchall()

    materials = []
    for r in rows:
        r = dict(r)
        mat = _serialize({k: v for k, v in r.items() if k != "uploader_name"})
        mat["uploader_name"] = r["uploader_name"]
        mat["files"] = _get_files(conn, mat["id"])
        materials.append(mat)

    return {
        "success": True,
        "message": "Central materials fetched successfully",
        "data": materials,
    }


# ── Get private materials (only uploader sees their own) ─────────────────────

def get_private_materials(conn, classroom_id: int, user_id: int) -> dict:
    _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                m.id, m.classroom_id, m.title, m.description,
                m.visibility, m.uploaded_by, m.created_at, m.updated_at
            FROM materials m
            WHERE m.classroom_id = %s AND m.visibility = 'PRIVATE' AND m.uploaded_by = %s
            ORDER BY m.created_at DESC
            """,
            (classroom_id, user_id),
        )
        rows = cur.fetchall()

    materials = []
    for r in rows:
        mat = _serialize(dict(r))
        mat["files"] = _get_files(conn, mat["id"])
        materials.append(mat)

    return {
        "success": True,
        "message": "Private materials fetched successfully",
        "data": materials,
    }


# ── Get single material ───────────────────────────────────────────────────────

def get_material(conn, classroom_id: int, material_id: int, user_id: int) -> dict:
    _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                m.id, m.classroom_id, m.title, m.description,
                m.visibility, m.uploaded_by, m.created_at, m.updated_at,
                u.full_name AS uploader_name
            FROM materials m
            JOIN users u ON u.id = m.uploaded_by
            WHERE m.id = %s AND m.classroom_id = %s
            """,
            (material_id, classroom_id),
        )
        r = cur.fetchone()

    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    r = dict(r)

    # Private material — only uploader can access
    if r["visibility"] == "PRIVATE" and r["uploaded_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    mat = _serialize({k: v for k, v in r.items() if k != "uploader_name"})
    mat["uploader_name"] = r["uploader_name"]
    mat["files"] = _get_files(conn, mat["id"])

    return {
        "success": True,
        "message": "Material fetched successfully",
        "data": mat,
    }






def get_material_by_agent(
    conn,
    classroom_id: int,
    material_id: int,
    user_id: int,
) -> bool:

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    m.id, m.classroom_id, m.title, m.description,
                    m.visibility, m.uploaded_by, m.created_at, m.updated_at,
                    u.full_name AS uploader_name
                FROM materials m
                JOIN users u ON u.id = m.uploaded_by
                WHERE m.id = %s AND m.classroom_id = %s
                """,
                (material_id, classroom_id),
            )
            r = cur.fetchone()

        if not r:
            return False

        r = dict(r)

        # Private material — only uploader can access
        if r["visibility"] == "PRIVATE" and r["uploaded_by"] != user_id:
            return False

        mat = _serialize({k: v for k, v in r.items() if k != "uploader_name"})
        mat["uploader_name"] = r["uploader_name"]
        mat["files"] = _get_files(conn, mat["id"])

        return True

    except Exception:
        return False









