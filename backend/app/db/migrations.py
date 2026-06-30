import os
from pathlib import Path

from loguru import logger


MIGRATIONS_DIR = Path(__file__).parent.parent.parent / "migrations"


def run_migrations(conn):
    """
    Runs all .sql files in /migrations in filename order.
    Tracks which ones already ran in a 'schema_migrations' table
    so each file is executed only once.
    """
    _ensure_migrations_table(conn)

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

    if not sql_files:
        logger.info("No migration files found")
        return

    for sql_file in sql_files:
        name = sql_file.name

        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM schema_migrations WHERE filename = %s",
                (name,),
            )
            already_ran = cur.fetchone()

        if already_ran:
            logger.info(f"[migration] skipping {name} (already applied)")
            continue

        logger.info(f"[migration] running {name} ...")
        sql = sql_file.read_text(encoding="utf-8")

        try:
            with conn.cursor() as cur:
                cur.execute(sql)
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO schema_migrations (filename) VALUES (%s)",
                    (name,),
                )
            conn.commit()
            logger.info(f"[migration] {name} applied OK")
        except Exception as e:
            conn.rollback()
            logger.error(f"[migration] {name} FAILED: {e}")
            raise


def _ensure_migrations_table(conn):
    """Creates the tracking table if it doesn't exist yet."""
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id         SERIAL PRIMARY KEY,
                filename   VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
    conn.commit()