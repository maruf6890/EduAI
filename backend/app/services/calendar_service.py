from fastapi import HTTPException, status


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    row = dict(row)
    for field in ("event_date", "created_at", "updated_at"):
        if row.get(field):
            row[field] = row[field].isoformat()
    return row


def _verify_enrolled_or_owner(conn, classroom_id: int, user_id: int) -> bool:
    """Returns True if owner, False if enrolled student, raises if neither."""
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["owner_id"] == user_id:
        return True

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM enrollments WHERE classroom_id = %s AND student_id = %s AND status = 'ACTIVE'",
            (classroom_id, user_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return False


# ── Auto-create event (called internally by assignment/quiz services) ─────────
# will be used by the agent for creating  event
def create_classroom_event(
    conn,
    classroom_id: int,
    title: str,
    description,
    event_date,
    event_type: str,
    reference_id: int,
    created_by: int,
) -> None:
    """
    Called automatically when a teacher creates an assignment or quiz with a due date.
    Not exposed as an API endpoint.
    """
    if not event_date:
        return

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO calendar_events
                (classroom_id, title, description, event_date, event_type, reference_id, created_by, is_personal)
            VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE)
            """,
            (classroom_id, title, description, event_date, event_type, reference_id, created_by),
        )


def update_classroom_event(
    conn,
    reference_id: int,
    event_type: str,
    title: str,
    event_date,
) -> None:
    """
    Called automatically when a teacher updates an assignment or quiz due date.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE calendar_events
            SET title = %s, event_date = %s, updated_at = NOW()
            WHERE reference_id = %s AND event_type = %s AND is_personal = FALSE
            """,
            (title, event_date, reference_id, event_type),
        )


def delete_classroom_event(conn, reference_id: int, event_type: str) -> None:
    """Called automatically when a teacher deletes an assignment or quiz."""
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM calendar_events WHERE reference_id = %s AND event_type = %s AND is_personal = FALSE",
            (reference_id, event_type),
        )


# ── Student: create personal task ────────────────────────────────────────────


#will be used  as to create personal task for agent 
def create_personal_task(
    conn,
    user_id: int,
    title: str,
    description,
    event_date,
    classroom_id,
) -> dict:
    # If classroom_id provided, verify access
    if classroom_id:
        _verify_enrolled_or_owner(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO calendar_events
                (classroom_id, title, description, event_date, event_type, created_by, is_personal)
            VALUES (%s, %s, %s, %s, 'TASK', %s, TRUE)
            RETURNING id, classroom_id, title, description, event_date,
                      event_type, reference_id, created_by, is_personal, created_at, updated_at
            """,
            (classroom_id, title, description, event_date, user_id),
        )
        event = _serialize(dict(cur.fetchone()))

    return {
        "success": True,
        "message": "Personal task created successfully",
        "data": event,
    }


# ── Student: update personal task ────────────────────────────────────────────

def update_personal_task(
    conn,
    event_id: int,
    user_id: int,
    title,
    description,
    event_date,
) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT created_by, is_personal FROM calendar_events WHERE id = %s",
            (event_id,),
        )
        event = cur.fetchone()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if not event["is_personal"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Classroom events cannot be edited")

    if event["created_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own tasks")

    updates = {}
    if title is not None:
        updates["title"] = title
    if description is not None:
        updates["description"] = description
    if event_date is not None:
        updates["event_date"] = event_date

    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [event_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE calendar_events SET {set_clause}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, classroom_id, title, description, event_date,
                      event_type, reference_id, created_by, is_personal, created_at, updated_at
            """,
            values,
        )
        event = _serialize(dict(cur.fetchone()))

    return {
        "success": True,
        "message": "Task updated successfully",
        "data": event,
    }


# ── Student: delete personal task ────────────────────────────────────────────

def delete_personal_task(conn, event_id: int, user_id: int) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT created_by, is_personal FROM calendar_events WHERE id = %s",
            (event_id,),
        )
        event = cur.fetchone()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if not event["is_personal"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Classroom events cannot be deleted")

    if event["created_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own tasks")

    with conn.cursor() as cur:
        cur.execute("DELETE FROM calendar_events WHERE id = %s", (event_id,))

    return {
        "success": True,
        "message": "Task deleted successfully",
        "data": None,
    }


# ── Get classroom calendar (teacher + students) ───────────────────────────────

def get_classroom_calendar(conn, classroom_id: int, user_id: int) -> dict:
    is_owner = _verify_enrolled_or_owner(conn, classroom_id, user_id)

    # Classroom events visible to everyone in the classroom
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, description, event_date,
                   event_type, reference_id, created_by, is_personal, created_at, updated_at
            FROM calendar_events
            WHERE classroom_id = %s AND is_personal = FALSE
            ORDER BY event_date ASC
            """,
            (classroom_id,),
        )
        classroom_events = [_serialize(dict(r)) for r in cur.fetchall()]

    # Personal tasks of this user inside this classroom
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, description, event_date,
                   event_type, reference_id, created_by, is_personal, created_at, updated_at
            FROM calendar_events
            WHERE classroom_id = %s AND is_personal = TRUE AND created_by = %s
            ORDER BY event_date ASC
            """,
            (classroom_id, user_id),
        )
        personal_events = [_serialize(dict(r)) for r in cur.fetchall()]

    return {
        "success": True,
        "message": "Calendar fetched successfully",
        "data": {
            "classroom_events": classroom_events,
            "personal_tasks": personal_events,
        },
    }


# ── Get personal calendar (all tasks across all classrooms) ──────────────────
#used as tools for agent 
def get_my_calendar(conn, user_id: int) -> dict:
    """
    Returns all classroom events from classrooms the user belongs to
    plus all their personal tasks.
    """
    # Classroom events from classrooms the user owns
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT ce.id, ce.classroom_id, ce.title, ce.description, ce.event_date,
                   ce.event_type, ce.reference_id, ce.created_by, ce.is_personal,
                   ce.created_at, ce.updated_at, c.name AS classroom_name
            FROM calendar_events ce
            JOIN classrooms c ON c.id = ce.classroom_id
            WHERE c.owner_id = %s AND ce.is_personal = FALSE
            ORDER BY ce.event_date ASC
            """,
            (user_id,),
        )
        owned_events = [_serialize(dict(r)) for r in cur.fetchall()]

    # Classroom events from classrooms the user is enrolled in
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT ce.id, ce.classroom_id, ce.title, ce.description, ce.event_date,
                   ce.event_type, ce.reference_id, ce.created_by, ce.is_personal,
                   ce.created_at, ce.updated_at, c.name AS classroom_name
            FROM calendar_events ce
            JOIN classrooms c ON c.id = ce.classroom_id
            JOIN enrollments e ON e.classroom_id = c.id
            WHERE e.student_id = %s AND e.status = 'ACTIVE' AND ce.is_personal = FALSE
            ORDER BY ce.event_date ASC
            """,
            (user_id,),
        )
        enrolled_events = [_serialize(dict(r)) for r in cur.fetchall()]

    # All personal tasks by this user
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, classroom_id, title, description, event_date,
                   event_type, reference_id, created_by, is_personal, created_at, updated_at
            FROM calendar_events
            WHERE created_by = %s AND is_personal = TRUE
            ORDER BY event_date ASC
            """,
            (user_id,),
        )
        personal_tasks = [_serialize(dict(r)) for r in cur.fetchall()]

    return {
        "success": True,
        "message": "Calendar fetched successfully",
        "data": {
            "classroom_events": owned_events + enrolled_events,
            "personal_tasks": personal_tasks,
        },
    }



#tools funcations 