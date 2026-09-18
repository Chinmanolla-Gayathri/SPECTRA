"""
SPECTRA - Server-Sent Events (SSE) Stream
GET /api/audits/{id}/events
Streams real-time agent execution events: OBSERVE -> SELECT -> EXECUTE -> EVIDENCE -> GRAPH
"""
import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from .audits import active_orchestrators, audit_runs_db

router = APIRouter(prefix="/api/audits", tags=["events"])

@router.get("/{run_id}/events")
async def stream_audit_events(run_id: str):
    if run_id not in active_orchestrators:
        raise HTTPException(status_code=404, detail="Audit run not found")

    orch = active_orchestrators[run_id]

    async def event_generator():
        try:
            async for event in orch.run():
                # Update in-memory db snapshot
                if event.get("type") == "STEP_COMPLETED":
                    audit_runs_db[run_id]["steps"].append(event)
                    if "graph" in event:
                        audit_runs_db[run_id]["graph"] = event["graph"]
                elif event.get("type") == "RUN_COMPLETED":
                    audit_runs_db[run_id]["status"] = "COMPLETED"
                    audit_runs_db[run_id]["friction_metrics"] = event.get("friction_metrics")
                    audit_runs_db[run_id]["findings"] = event.get("findings")
                    audit_runs_db[run_id]["graph"] = event.get("graph")

                data_str = json.dumps(event)
                yield f"data: {data_str}\n\n"
        except asyncio.CancelledError:
            orch.is_running = False

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
