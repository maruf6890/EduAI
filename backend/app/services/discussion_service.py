from fastapi import HTTPException, status


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    row = dict(row)
    for field in ("created_at", "updated_at"):
        if row.get(field):
            row[field] = row[field].isoformat()
    return row


def _verify_member(conn, classroom_id: int, user_id: int) -> bool:
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
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this classroom")

    return False


def _verify_owner(conn, classroom_id: int, user_id: int):
    with conn.cursor() as cur:
        cur.execute("SELECT owner_id FROM classrooms WHERE id = %s", (classroom_id,))
        classroom = cur.fetchone()

    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    if classroom["owner_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the classroom owner can do this")


def _build_comment_tree(comments: list) -> list:
    """
    Build nested comment tree from flat list.
    Supports infinite nesting via parent_id self-reference.
    """
    comment_map = {}
    roots = []

    # Index all comments by id
    for c in comments:
        c["replies"] = []
        comment_map[c["id"]] = c

    # Build tree
    for c in comments:
        if c["parent_id"] is None:
            roots.append(c)
        else:
            parent = comment_map.get(c["parent_id"])
            if parent:
                parent["replies"].append(c)

    return roots


def _get_comment_tree(conn, post_id: int) -> list:
    """Fetch all comments for a post and return as nested tree."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                dc.id, dc.post_id, dc.parent_id, dc.content,
                dc.created_at, dc.updated_at,
                u.id        AS user_id,
                u.full_name AS user_name,
                u.email     AS user_email
            FROM discussion_comments dc
            JOIN users u ON u.id = dc.created_by
            WHERE dc.post_id = %s
            ORDER BY dc.created_at ASC
            """,
            (post_id,),
        )
        rows = cur.fetchall()

    flat = []
    for r in rows:
        r = dict(r)
        comment = _serialize({
            "id": r["id"],
            "post_id": r["post_id"],
            "parent_id": r["parent_id"],
            "content": r["content"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "created_by": {
                "id": r["user_id"],
                "full_name": r["user_name"],
                "email": r["user_email"],
            },
        })
        flat.append(comment)

    return _build_comment_tree(flat)


# ── Teacher: create post ──────────────────────────────────────────────────────

def create_post(conn, classroom_id: int, created_by: int, title: str, content) -> dict:
    _verify_owner(conn, classroom_id, created_by)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO discussion_posts (classroom_id, title, content, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id, classroom_id, title, content, created_by, is_active, created_at, updated_at
            """,
            (classroom_id, title, content, created_by),
        )
        post = _serialize(dict(cur.fetchone()))

    post["comments"] = []

    return {
        "success": True,
        "message": "Post created successfully",
        "data": post,
    }


# ── Teacher: update post ──────────────────────────────────────────────────────

def update_post(conn, classroom_id: int, post_id: int, owner_id: int, title, content, is_active) -> dict:
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
    values = list(updates.values()) + [post_id, classroom_id]

    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE discussion_posts
            SET {set_clause}, updated_at = NOW()
            WHERE id = %s AND classroom_id = %s
            RETURNING id, classroom_id, title, content, created_by, is_active, created_at, updated_at
            """,
            values,
        )
        post = cur.fetchone()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    post = _serialize(dict(post))
    post["comments"] = _get_comment_tree(conn, post["id"])

    return {
        "success": True,
        "message": "Post updated successfully",
        "data": post,
    }


# ── Teacher: delete post ──────────────────────────────────────────────────────

def delete_post(conn, classroom_id: int, post_id: int, owner_id: int) -> dict:
    _verify_owner(conn, classroom_id, owner_id)

    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM discussion_posts WHERE id = %s AND classroom_id = %s RETURNING id",
            (post_id, classroom_id),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    return {
        "success": True,
        "message": "Post deleted successfully",
        "data": None,
    }


# ── Anyone: list all posts ────────────────────────────────────────────────────

def get_posts(conn, classroom_id: int, user_id: int) -> dict:
    is_owner = _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        # Owner sees all posts, students see only active ones
        if is_owner:
            cur.execute(
                """
                SELECT
                    dp.id, dp.classroom_id, dp.title, dp.content,
                    dp.is_active, dp.created_at, dp.updated_at,
                    u.id        AS user_id,
                    u.full_name AS user_name,
                    u.email     AS user_email
                FROM discussion_posts dp
                JOIN users u ON u.id = dp.created_by
                WHERE dp.classroom_id = %s
                ORDER BY dp.created_at DESC
                """,
                (classroom_id,),
            )
        else:
            cur.execute(
                """
                SELECT
                    dp.id, dp.classroom_id, dp.title, dp.content,
                    dp.is_active, dp.created_at, dp.updated_at,
                    u.id        AS user_id,
                    u.full_name AS user_name,
                    u.email     AS user_email
                FROM discussion_posts dp
                JOIN users u ON u.id = dp.created_by
                WHERE dp.classroom_id = %s AND dp.is_active = TRUE
                ORDER BY dp.created_at DESC
                """,
                (classroom_id,),
            )
        rows = cur.fetchall()

    posts = []
    for r in rows:
        r = dict(r)
        post = _serialize({
            "id": r["id"],
            "classroom_id": r["classroom_id"],
            "title": r["title"],
            "content": r["content"],
            "is_active": r["is_active"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "created_by": {
                "id": r["user_id"],
                "full_name": r["user_name"],
                "email": r["user_email"],
            },
        })
        post["comments"] = _get_comment_tree(conn, post["id"])
        posts.append(post)

    return {
        "success": True,
        "message": "Posts fetched successfully",
        "data": posts,
    }


# ── Anyone: get single post ───────────────────────────────────────────────────

def get_post(conn, classroom_id: int, post_id: int, user_id: int) -> dict:
    is_owner = _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                dp.id, dp.classroom_id, dp.title, dp.content,
                dp.is_active, dp.created_at, dp.updated_at,
                u.id        AS user_id,
                u.full_name AS user_name,
                u.email     AS user_email
            FROM discussion_posts dp
            JOIN users u ON u.id = dp.created_by
            WHERE dp.id = %s AND dp.classroom_id = %s
            """,
            (post_id, classroom_id),
        )
        r = cur.fetchone()

    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    r = dict(r)

    if not is_owner and not r["is_active"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    post = _serialize({
        "id": r["id"],
        "classroom_id": r["classroom_id"],
        "title": r["title"],
        "content": r["content"],
        "is_active": r["is_active"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "created_by": {
            "id": r["user_id"],
            "full_name": r["user_name"],
            "email": r["user_email"],
        },
    })
    post["comments"] = _get_comment_tree(conn, post["id"])

    return {
        "success": True,
        "message": "Post fetched successfully",
        "data": post,
    }


# ── Anyone: add comment or reply ──────────────────────────────────────────────

def create_comment(
    conn,
    classroom_id: int,
    post_id: int,
    user_id: int,
    content: str,
    parent_id,
) -> dict:
    _verify_member(conn, classroom_id, user_id)

    # Verify post exists and is active
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, is_active FROM discussion_posts WHERE id = %s AND classroom_id = %s",
            (post_id, classroom_id),
        )
        post = cur.fetchone()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    if not post["is_active"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Post is no longer active")

    # If replying, verify parent comment exists and belongs to same post
    if parent_id:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM discussion_comments WHERE id = %s AND post_id = %s",
                (parent_id, post_id),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found")

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO discussion_comments (post_id, parent_id, content, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id, post_id, parent_id, content, created_by, created_at, updated_at
            """,
            (post_id, parent_id, content, user_id),
        )
        comment = _serialize(dict(cur.fetchone()))

    # Attach user info
    with conn.cursor() as cur:
        cur.execute("SELECT id, full_name, email FROM users WHERE id = %s", (user_id,))
        user = dict(cur.fetchone())

    comment["created_by"] = user
    comment["replies"] = []

    return {
        "success": True,
        "message": "Comment added successfully",
        "data": comment,
    }


# ── Anyone: update own comment ────────────────────────────────────────────────

def update_comment(conn, classroom_id: int, comment_id: int, user_id: int, content: str) -> dict:
    _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            "SELECT created_by FROM discussion_comments WHERE id = %s",
            (comment_id,),
        )
        comment = cur.fetchone()

    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment["created_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own comments")

    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE discussion_comments
            SET content = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, post_id, parent_id, content, created_by, created_at, updated_at
            """,
            (content, comment_id),
        )
        updated = _serialize(dict(cur.fetchone()))

    with conn.cursor() as cur:
        cur.execute("SELECT id, full_name, email FROM users WHERE id = %s", (user_id,))
        user = dict(cur.fetchone())

    updated["created_by"] = user

    return {
        "success": True,
        "message": "Comment updated successfully",
        "data": updated,
    }


# ── Anyone: delete own comment (teacher can delete any) ──────────────────────

def delete_comment(conn, classroom_id: int, post_id: int, comment_id: int, user_id: int) -> dict:
    is_owner = _verify_member(conn, classroom_id, user_id)

    with conn.cursor() as cur:
        cur.execute(
            "SELECT created_by FROM discussion_comments WHERE id = %s AND post_id = %s",
            (comment_id, post_id),
        )
        comment = cur.fetchone()

    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    # Teacher can delete any comment, student can only delete their own
    if not is_owner and comment["created_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments")

    with conn.cursor() as cur:
        cur.execute("DELETE FROM discussion_comments WHERE id = %s", (comment_id,))

    return {
        "success": True,
        "message": "Comment deleted successfully",
        "data": None,
    }