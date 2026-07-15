import logging
import uuid

from fastapi import HTTPException, UploadFile, status

logger = logging.getLogger(__name__)

VALID_VISIBILITIES = {"CENTRAL", "PRIVATE"}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    row = dict(row)
    for field in ("created_at", "updated_at"):
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


MATERIAL_COLUMNS = """
id,
classroom_id,
title,
description,
visibility,
url,
uploaded_by,
ingestion_status,
created_at,
updated_at
"""
async def upload_material(
    conn,
    classroom_id: int,
    uploaded_by: int,
    title: str,
    description,
    visibility: str,
    file: UploadFile,
) -> dict:

    classroom = _get_classroom(conn, classroom_id)

    is_owner = classroom["owner_id"] == uploaded_by

    if not is_owner:
        _verify_enrolled(conn, classroom_id, uploaded_by)


    if visibility not in VALID_VISIBILITIES:
        raise HTTPException(
            status_code=400,
            detail=f"visibility must be one of {sorted(VALID_VISIBILITIES)}",
        )


    if visibility == "CENTRAL" and not is_owner:
        raise HTTPException(
            status_code=403,
            detail="Only teacher can upload central materials",
        )


    if not file:
        raise HTTPException(
            status_code=400,
            detail="File required",
        )


    is_pdf = file.content_type == "application/pdf"


    # ---------------------------
    # Upload to cloudinary
    # ---------------------------

    from app.utils.cloudinary import upload_file_to_cloudinary


    await file.seek(0)

    upload_slug = uuid.uuid4().hex


    file_data = await upload_file_to_cloudinary(
        file,
        folder=f"ai_classroom/materials/{visibility.lower()}/{classroom_id}/{upload_slug}",
    )


    # ---------------------------
    # Insert material
    # ---------------------------

    with conn.cursor() as cur:

        cur.execute(
            f"""
            INSERT INTO materials
            (
                title,
                description,
                visibility,
                uploaded_by,
                classroom_id,
                url,
                ingestion_status
            )

            VALUES
            (%s,%s,%s,%s,%s,%s,%s)

            RETURNING {MATERIAL_COLUMNS}
            """,

            (
                title,
                description,
                visibility,
                uploaded_by,
                classroom_id,
                file_data["url"],
                "processing" if is_pdf else "skipped"
            )
        )


        material = _serialize(dict(cur.fetchone()))

        conn.commit()



    # ---------------------------
    # RAG ingestion
    # ---------------------------

    if is_pdf:

        try:

            from app.ai.services.rag_services import (
                extract_docs_with_chunking,
                store_in_vector_db
            )


            await file.seek(0)


            docs = extract_docs_with_chunking(
                pdf_file=file.file,
                title=title,
                description=description,
                classroom_id=str(classroom_id),
                doc_type=visibility.lower(),
                created_by=str(uploaded_by)
            )


            count = store_in_vector_db(docs)


            ingestion_status = (
                "completed"
                if count > 0
                else "failed"
            )


        except Exception as e:

            logger.exception(
                "PDF ingestion failed material_id=%s",
                material["id"]
            )

            ingestion_status = "failed"



        # update DB

        with conn.cursor() as cur:

            cur.execute(
                """
                UPDATE materials
                SET ingestion_status=%s,
                    updated_at=NOW()

                WHERE id=%s
                """,

                (
                    ingestion_status,
                    material["id"]
                )
            )

            conn.commit()


        material["ingestion_status"] = ingestion_status



    return {
        "success": True,
        "message": "Material uploaded successfully",
        "data": material,
    }
# ── Update material info ──────────────────────────────────────────────────────

def update_material(conn, classroom_id: int, material_id: int, user_id: int, title, description) -> dict:
    _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute("SELECT uploaded_by FROM materials WHERE id = %s AND classroom_id = %s", (material_id, classroom_id))
        material = cur.fetchone()

    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    # Only the uploader can update
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
            RETURNING {MATERIAL_COLUMNS}
            """,
            values,
        )
        updated = _serialize(dict(cur.fetchone()))

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

    # Teacher can delete any material in their classroom; everyone else can
    # only delete their own uploads.
    if not is_owner and material["uploaded_by"] != user_id:
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
                m.id, m.classroom_id, m.title, m.description,m.ingestion_status,
                m.visibility, m.url, m.uploaded_by, m.created_at, m.updated_at,
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
        materials.append(mat)

    return {
        "success": True,
        "message": "Central materials fetched successfully",
        "data": materials,
    }


def get_private_materials(conn, classroom_id: int, user_id: int) -> dict:
    _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                m.id, m.classroom_id, m.title, m.description,m.ingestion_status,
                m.visibility, m.url, m.uploaded_by, m.created_at, m.updated_at
            FROM materials m
            WHERE m.classroom_id = %s AND m.visibility = 'PRIVATE' AND m.uploaded_by = %s
            ORDER BY m.created_at DESC
            """,
            (classroom_id, user_id),
        )
        rows = cur.fetchall()

    materials = [_serialize(dict(r)) for r in rows]

    return {
        "success": True,
        "message": "Private materials fetched successfully",
        "data": materials,
    }
