import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from contextlib import asynccontextmanager
from core.scheduler import start_scheduler

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler = None
    if not os.environ.get("VERCEL"):
        scheduler = start_scheduler()
    yield
    # Shutdown
    if scheduler:
        scheduler.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="NewsPulse AI API",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, news, nlp, chat, recommendations, admin, bookmarks, users, cron

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API v{settings.VERSION}"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(news.router)
app.include_router(nlp.router)
app.include_router(chat.router)
app.include_router(recommendations.router)
app.include_router(admin.router)
app.include_router(bookmarks.router)
app.include_router(cron.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
