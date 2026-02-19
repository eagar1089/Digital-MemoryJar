from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
import logging


from backend.routers import auth, memories, dashboard
from backend.nlp_processor import process_unprocessed_memories

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

app = FastAPI(title="DMJ Backend")

# Allow local dev frontend to call the API; lock this down in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:3001","http://127.0.0.1:3000","http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(memories.router, prefix="/memories", tags=["memories"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])


# Background scheduler for processing unprocessed memories
scheduler = BackgroundScheduler()

def process_memories_job():
    """Job that runs every 10 seconds to process unprocessed memories."""
    try:
        # logger.info("Running memory processing job...")
        process_unprocessed_memories()
        # logger.info("Memory processing job completed.")
    except Exception as e:
        logger.error(f"Error in memory processing job: {e}")

scheduler.add_job(process_memories_job, "interval", seconds=10, id="process_memories")
scheduler.start()


@app.on_event("startup")
def startup_event():
    logger.info("*********************************Application startup - scheduler running*********************************")


@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    logger.info("*********************************Application shutdown - scheduler stopped*********************************")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)

