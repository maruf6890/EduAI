from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from fastapi import HTTPException

from app.core.config import settings
from app.db.connection import close_db_pool, init_db_pool
import psycopg2
import psycopg2.extras
from app.db.migrations import run_migrations
from app.routers.auth import router as auth_router
from app.routers.classroom import router as classroom_router
from app.routers.enrollment import router as enrollment_router
from app.routers.assignment import router as assignment_router
from app.routers.announcement import router as announcement_router
from app.routers.calendar import router as calendar_router
from app.routers.quiz import router as quiz_router
from app.routers.discussion import router as discussion_router
from app.routers.material import router as material_router
from app.routers.chat_routes import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    init_db_pool()

    # Use a dedicated raw connection for migrations (avoids pool commit conflicts)
    from app.core.config import settings
    migration_conn = psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    try:
        run_migrations(migration_conn)
    finally:
        migration_conn.close()

    yield
    close_db_pool()
    logger.info("Shut down.")


app = FastAPI(
    title="AI Classroom API",
    description="CSE 2201 — AI-powered classroom backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
        },
    )



app.include_router(auth_router,       prefix="/api/v1")
app.include_router(classroom_router,  prefix="/api/v1")
app.include_router(enrollment_router, prefix="/api/v1")
app.include_router(assignment_router, prefix="/api/v1")
app.include_router(announcement_router, prefix="/api/v1")
app.include_router(calendar_router, prefix="/api/v1")
app.include_router(quiz_router, prefix="/api/v1")
app.include_router(discussion_router, prefix="/api/v1")
app.include_router(material_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)