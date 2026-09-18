"""
SPECTRA - Main FastAPI Application
Entry point for Python backend service.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.audits import router as audits_router
from .api.events import router as events_router
from .api.reports import router as reports_router
from .db.database import init_db

app = FastAPI(
    title="SPECTRA - Autonomous Black-Box UI/UX & Accessibility Testing",
    description="Autonomous testing framework using Gemini 3.8 Flash, Playwright, state graph mapping, and axe-core.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(audits_router)
app.include_router(events_router)
app.include_router(reports_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "SPECTRA Autonomous Testing Framework", "model": "gemini-3.8-flash"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("spectra.backend.main:app", host="0.0.0.0", port=8000, reload=True)
