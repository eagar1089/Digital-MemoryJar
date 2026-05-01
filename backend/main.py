from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
import logging
import os
import time
from pathlib import Path

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

# Load environment variables from .env before importing modules that depend on them
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
load_dotenv()

from backend.routers import auth, memories, dashboard, spotify, ai_features
from backend.nlp_processor import process_unprocessed_memories

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DMJ Backend")

HTTP_REQUESTS_TOTAL = Counter(
    "dmj_http_requests_total",
    "Total HTTP requests handled by the backend",
    ["method", "path", "status"],
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "dmj_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
)

NLP_JOB_TOTAL = Counter(
    "dmj_nlp_jobs_total",
    "Total NLP background jobs processed",
    ["status"],
)

NLP_JOB_DURATION_SECONDS = Histogram(
    "dmj_nlp_job_duration_seconds",
    "NLP background job duration in seconds",
)

NLP_JOB_RUNNING = Gauge(
    "dmj_nlp_job_running",
    "Whether the NLP background job is currently running",
)

# Allow local dev frontend to call the API on any local port.
# You can override with CORS_ALLOW_ORIGINS="http://localhost:3000,http://127.0.0.1:3001"
configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS","https://v0-djjv2.vercel.app,https://dmemoryjar.vercel.app").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def prometheus_metrics_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start_time

    route = request.scope.get("route")
    path = getattr(route, "path_format", request.url.path)

    HTTP_REQUESTS_TOTAL.labels(
        method=request.method,
        path=path,
        status=str(response.status_code),
    ).inc()
    HTTP_REQUEST_DURATION_SECONDS.labels(
        method=request.method,
        path=path,
    ).observe(duration)

    return response


@app.get("/healthz")
def health():
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/")
def root():
    return {
        "service": "DMJ Backend",
        "status": "ok",
        "health": "/healthz",
        "docs": "/docs",
    }


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(memories.router, prefix="/memories", tags=["memories"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(spotify.router, prefix="/spotify", tags=["spotify"])
app.include_router(ai_features.router, prefix="/ai", tags=["ai"])


scheduler = BackgroundScheduler()


def _scheduler_enabled() -> bool:
    return os.getenv("ENABLE_NLP_SCHEDULER", "false").strip().lower() in {"1", "true", "yes", "on"}


def _scheduler_interval_seconds() -> int:
    value = os.getenv("NLP_SCHEDULER_INTERVAL_SECONDS", "30")
    try:
        seconds = int(value)
        return max(seconds, 10)
    except ValueError:
        return 30


def process_memories_job():
    """Job that processes unprocessed memories in the background."""
    NLP_JOB_RUNNING.set(1)
    start_time = time.perf_counter()
    try:
        process_unprocessed_memories()
        NLP_JOB_TOTAL.labels(status="success").inc()
    except Exception as e:
        NLP_JOB_TOTAL.labels(status="error").inc()
        logger.error(f"Error in memory processing job: {e}")
    finally:
        NLP_JOB_DURATION_SECONDS.observe(time.perf_counter() - start_time)
        NLP_JOB_RUNNING.set(0)


@app.on_event("startup")
def startup_event():
    if _scheduler_enabled():
        scheduler.add_job(
            process_memories_job,
            "interval",
            seconds=_scheduler_interval_seconds(),
            id="process_memories",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Application startup - NLP scheduler running")
    else:
        logger.info("Application startup - NLP scheduler disabled")


@app.on_event("shutdown")
def shutdown_event():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Application shutdown - NLP scheduler stopped")
    else:
        logger.info("Application shutdown")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)