
from psycopg.rows import dict_row


def _to_vector_literal(embedding: list[float]) -> str:
    """psycopg has no native pgvector type - pass as text and cast with ::vector."""
    return "[" + ",".join(f"{x:.8f}" for x in embedding) + "]"


def create_request(
    conn,
    *,
    requested_by: int,
    title: str,
    description: str | None,
    summary: str,
    embedding: list[float],
) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO classroom_requests
                (requested_by, title, description, summary, embedding, status)
            VALUES (%s, %s, %s, %s, %s::vector, 'PENDING')
            RETURNING id
            """,
            (requested_by, title, description, summary, _to_vector_literal(embedding)),
        )
        request_id = cur.fetchone()
    conn.commit()
    return request_id["id"]


def find_similar_classrooms(conn, *, embedding: list[float], limit: int = 5) -> list[dict]:
    vec = _to_vector_literal(embedding)
    with conn.cursor() as cur:
        cur.execute(
            """
          SELECT 
            c.id,
            c.name,
            c.course_title,
            c.description,
            1 - (e.embedding <=> %s::vector) AS similarity
        FROM classrooms c
        JOIN community_classrooms_embeddings e 
            ON e.community_classroom_id = c.id
        WHERE 
            c.is_active = true
            AND e.embedding IS NOT NULL
        ORDER BY 
            e.embedding <=> %s::vector
        LIMIT %s;
            """,
            (vec, vec, limit),
        )
        return cur.fetchall()


def create_classroom(
    conn,
    *,
    name: str,
    course_title: str,
    description: str,
    embedding: list[float],
) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO classrooms
                (name, course_title, description, is_active, classroom_type)
            VALUES (%s, %s, %s, true, 'COMMUNITY')
            RETURNING id
            """,
            (name, course_title, description),
        )
        classroom_id = cur.fetchone()["id"]

    conn.commit()

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO community_classrooms_embeddings
                (community_classroom_id, embedding)
            VALUES (%s, %s::vector)
            """,
            (classroom_id, _to_vector_literal(embedding)),
        )
    return classroom_id

