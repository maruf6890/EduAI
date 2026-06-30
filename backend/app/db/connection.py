import psycopg2
import psycopg2.extras
from psycopg2 import pool
from loguru import logger

from app.core.config import settings

_pool: pool.ThreadedConnectionPool = None


def init_db_pool():
    global _pool
    _pool = pool.ThreadedConnectionPool(
        minconn=2,
        maxconn=20,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    logger.info("DB pool initialized")


def close_db_pool():
    global _pool
    if _pool:
        _pool.closeall()
        logger.info("DB pool closed")


def get_db():
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)
