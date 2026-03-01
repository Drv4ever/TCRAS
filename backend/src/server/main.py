import logging
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from src.server.api.routes import router as base_router
from src.server.api.events import router as events_router
from src.server.api.sse import router as sse_router
from src.server.db.database import engine, Base
import uvicorn
import os

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TCRAS_Server")

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TCRAS Security Server")

# Mount Static & Templates
# Ensure directories exist
os.makedirs("src/server/static", exist_ok=True)
os.makedirs("src/server/templates", exist_ok=True)

app.mount("/static", StaticFiles(directory="src/server/static"), name="static")
templates = Jinja2Templates(directory="src/server/templates")

# Include API Router
app.include_router(base_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(sse_router, prefix="/api")

@app.get("/")
def read_root(request: Request):
    """
    Serve the main dashboard.
    """
    from src.server.core.config import settings
    return templates.TemplateResponse("index.html", {
        "request": request,
        "server_url": "", # Use relative path for same-origin support (works on localhost & LAN)
        "api_key": settings.get_api_key() # In production, use session/cookie. For local tool, this is fine.
    })

if __name__ == "__main__":
    uvicorn.run("src.server.main:app", host="0.0.0.0", port=8000, reload=True)
