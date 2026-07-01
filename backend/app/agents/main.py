from fastapi import FastAPI

from app.api.chat_routes import router as chat_router

app = FastAPI(title="Edu AI Agent API")

app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok"}
