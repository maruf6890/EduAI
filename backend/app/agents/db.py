import psycopg

from app.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD


def get_connection():
    """Open a fresh psycopg connection. One per request — simplest thing
    that works correctly under FastAPI's concurrency; swap for a
    psycopg_pool.ConnectionPool if you need to reduce connection churn."""
    return psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )


def get_db():
    """FastAPI dependency: yields a connection, always closes it after
    the request, regardless of success or failure."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
