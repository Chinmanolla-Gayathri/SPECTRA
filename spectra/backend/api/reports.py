"""
SPECTRA - Reports & State Graph API
Endpoints:
GET /api/audits/{id}/report
GET /api/audits/{id}/graph
GET /api/audits/{id}/report/html
"""
from fastapi import APIRouter, HTTPException, Response
from .audits import audit_runs_db
from ..reports.generator import ReportGenerator

router = APIRouter(prefix="/api/audits", tags=["reports"])
report_gen = ReportGenerator()

@router.get("/{run_id}/report")
async def get_audit_report(run_id: str):
    if run_id not in audit_runs_db:
        raise HTTPException(status_code=404, detail="Audit run not found")
    return audit_runs_db[run_id]

@router.get("/{run_id}/graph")
async def get_state_graph(run_id: str):
    if run_id not in audit_runs_db:
        raise HTTPException(status_code=404, detail="Audit run not found")
    return audit_runs_db[run_id].get("graph", {"nodes": [], "edges": []})

@router.get("/{run_id}/report/html")
async def get_audit_html_report(run_id: str):
    if run_id not in audit_runs_db:
        raise HTTPException(status_code=404, detail="Audit run not found")
    html_content = report_gen.generate_html(audit_runs_db[run_id])
    return Response(content=html_content, media_type="text/html")
