from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.db.connection import close_db_pool, init_db_pool
from app.routers.auth import router as auth_router
from app.routers.classroom import router as classroom_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    init_db_pool()
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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Routes 
app.include_router(auth_router, prefix="/api/v1")
app.include_router(classroom_router, prefix="/api/v1")

@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to the AI Classroom API!"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
