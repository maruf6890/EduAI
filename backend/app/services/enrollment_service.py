from fastapi import HTTPException, status


def _serialize(row: dict) -> dict:
    row = dict(row)
    if row.get("joined_at"):
        row["joined_at"] = row["joined_at"].isoformat()
    if row.get("created_at"):
        row["created_at"] = row["created_at"].isoformat()
    return row


def join_classroom(conn, student_id: int, join_code: str) -> dict:
    # Find the classroom by join code
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, course_code, course_title, owner_id, is_active
            FROM classrooms
            WHERE join_code = %s
            """,
            (join_code,),
        )
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid join code")

    if not classroom["is_active"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This classroom is no longer active")

    # Owner cannot enroll in their own classroom
    if classroom["owner_id"] == student_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are the owner of this classroom")

    # Check if already enrolled
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status FROM enrollments WHERE classroom_id = %s AND student_id = %s",
            (classroom["id"], student_id),
        )
        existing = cur.fetchone()

    if existing:
        if existing["status"] == "ACTIVE":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled in this classroom")

        # Was removed/inactive — re-activate
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE enrollments SET status = 'ACTIVE', joined_at = NOW()
                WHERE classroom_id = %s AND student_id = %s
                RETURNING id, classroom_id, student_id, joined_at, status
                """,
                (classroom["id"], student_id),
            )
            enrollment = cur.fetchone()

        return {
            "message": "Re-joined classroom successfully",
            "enrollment": _serialize(enrollment),
            "classroom": {
                "id": classroom["id"],
                "name": classroom["name"],
                "course_code": classroom["course_code"],
                "course_title": classroom["course_title"],
            },
        }

    # Fresh enrollment
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO enrollments (classroom_id, student_id)
            VALUES (%s, %s)
            RETURNING id, classroom_id, student_id, joined_at, status
            """,
            (classroom["id"], student_id),
        )
        enrollment = cur.fetchone()

    return {
        "message": "Joined classroom successfully",
        "enrollment": _serialize(enrollment),
        "classroom": {
            "id": classroom["id"],
            "name": classroom["name"],
            "course_code": classroom["course_code"],
            "course_title": classroom["course_title"],
        },
    }


def leave_classroom(conn, student_id: int, classroom_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, status FROM enrollments WHERE classroom_id = %s AND student_id = %s",
            (classroom_id, student_id),
        )
        enrollment = cur.fetchone()

    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You are not enrolled in this classroom")

    if enrollment["status"] == "INACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already left this classroom")

    with conn.cursor() as cur:
        cur.execute(
            "UPDATE enrollments SET status = 'INACTIVE' WHERE classroom_id = %s AND student_id = %s",
            (classroom_id, student_id),
        )

    return {"message": "Left classroom successfully"}


def get_my_enrolled_classrooms(conn, student_id: int) -> dict:
    """All classrooms the current user is enrolled in (as student)."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                e.id           AS enrollment_id,
                e.joined_at,
                e.status       AS enrollment_status,
                c.id           AS classroom_id,
                c.name,
                c.course_code,
                c.course_title,
                c.description,
                c.semester,
                c.is_active    AS classroom_active,
                u.full_name    AS owner_name
            FROM enrollments e
            JOIN classrooms c ON c.id = e.classroom_id
            JOIN users u      ON u.id = c.owner_id
            WHERE e.student_id = %s AND e.status = 'ACTIVE'
            ORDER BY e.joined_at DESC
            """,
            (student_id,),
        )
        rows = cur.fetchall()

    return {
        "classrooms": [
            {
                "enrollment_id": r["enrollment_id"],
                "joined_at": r["joined_at"].isoformat(),
                "enrollment_status": r["enrollment_status"],
                "classroom": {
                    "id": r["classroom_id"],
                    "name": r["name"],
                    "course_code": r["course_code"],
                    "course_title": r["course_title"],
                    "description": r["description"],
                    "semester": r["semester"],
                    "is_active": r["classroom_active"],
                    "owner_name": r["owner_name"],
                },
            }
            for r in rows
        ]
    }


def get_classroom_students(conn, classroom_id: int, owner_id: int) -> dict:
    """Owner views all students enrolled in their classroom."""
    # Verify ownership
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                e.id        AS enrollment_id,
                e.joined_at,
                e.status,
                u.id        AS student_id,
                u.full_name,
                u.email
            FROM enrollments e
            JOIN users u ON u.id = e.student_id
            WHERE e.classroom_id = %s
            ORDER BY e.joined_at ASC
            """,
            (classroom_id,),
        )
        rows = cur.fetchall()

    return {
        "students": [
            {
                "enrollment_id": r["enrollment_id"],
                "joined_at": r["joined_at"].isoformat(),
                "status": r["status"],
                "student": {
                    "id": r["student_id"],
                    "full_name": r["full_name"],
                    "email": r["email"],
                },
            }
            for r in rows
        ]
    }


def remove_student(conn, classroom_id: int, student_id: int, owner_id: int) -> dict:
    """Owner removes a student from their classroom."""
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["owner_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM enrollments WHERE classroom_id = %s AND student_id = %s",
            (classroom_id, student_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not enrolled")

        cur.execute(
            "UPDATE enrollments SET status = 'INACTIVE' WHERE classroom_id = %s AND student_id = %s",
            (classroom_id, student_id),
        )

    return {"message": "Student removed from classroom"}