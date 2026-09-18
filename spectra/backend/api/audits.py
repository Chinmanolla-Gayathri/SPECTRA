"""
SPECTRA - FastAPI Audits API
Endpoints:
POST /api/audits
POST /api/audits/{id}/start
POST /api/audits/{id}/stop
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid

from ..agents.goal_parser import GoalParser
from ..agents.orchestrator import Orchestrator

router = APIRouter(prefix="/api/audits", tags=["audits"])

# In-memory orchestrator registry
active_orchestrators: Dict[str, Orchestrator] = {}
audit_runs_db: Dict[str, Dict[str, Any]] = {}

class CreateAuditRequest(BaseModel):
    goal: str = Field(..., example="Find blue running shoes under ₹5000 and reach checkout as guest")
    entry_url: str = Field(..., example="http://localhost:3000/demo-app")
    max_steps: int = 15
    max_paths: int = 3
    exploration_enabled: bool = True
    demo_mode: bool = True

@router.post("")
async def create_audit(req: CreateAuditRequest):
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    parser = GoalParser()
    parsed_goal = await parser.parse(
        raw_goal=req.goal,
        entry_url=req.entry_url,
        max_steps=req.max_steps,
        max_paths=req.max_paths
    )
    
    audit_runs_db[run_id] = {
        "id": run_id,
        "goal": parsed_goal.model_dump(),
        "status": "READY",
        "steps": [],
        "findings": [],
        "friction_metrics": None,
        "graph": {"nodes": [], "edges": []}
    }

    orch = Orchestrator(run_id=run_id, goal=parsed_goal, demo_mode=req.demo_mode)
    active_orchestrators[run_id] = orch

    return {"run_id": run_id, "goal": parsed_goal.model_dump(), "status": "READY"}

@router.get("")
async def list_audits():
    return list(audit_runs_db.values())

@router.get("/{run_id}")
async def get_audit(run_id: str):
    if run_id not in audit_runs_db:
        raise HTTPException(status_code=404, detail="Audit run not found")
    return audit_runs_db[run_id]

@router.post("/{run_id}/start")
async def start_audit(run_id: str, background_tasks: BackgroundTasks):
    if run_id not in active_orchestrators:
        raise HTTPException(status_code=404, detail="Audit orchestrator not found")
    
    orch = active_orchestrators[run_id]
    audit_runs_db[run_id]["status"] = "RUNNING"
    return {"status": "RUNNING", "run_id": run_id}

@router.post("/{run_id}/stop")
async def stop_audit(run_id: str):
    if run_id in active_orchestrators:
        active_orchestrators[run_id].is_running = False
        audit_runs_db[run_id]["status"] = "STOPPED"
    return {"status": "STOPPED", "run_id": run_id}
