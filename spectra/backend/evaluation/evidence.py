"""
SPECTRA - Evidence Store
Collects screenshots, step traces, action latency, and DOM snapshots for audit reports.
"""
import os
import json
import base64
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class StepEvidence(BaseModel):
    step_number: int
    url: str
    action_type: str
    semantic_target: str
    latency_ms: int
    timestamp: float
    screenshot_base64: Optional[str] = None
    state_id: str
    finding_ids: List[str] = []

class EvidenceStore:
    def __init__(self, run_id: str, artifact_dir: str = "artifacts/runs"):
        self.run_id = run_id
        self.run_dir = os.path.join(artifact_dir, run_id)
        os.makedirs(self.run_dir, exist_ok=True)
        self.steps: List[StepEvidence] = []

    def record_step(
        self,
        step_number: int,
        url: str,
        action_type: str,
        semantic_target: str,
        latency_ms: int,
        state_id: str,
        screenshot_bytes: Optional[bytes] = None,
        finding_ids: Optional[List[str]] = None
    ) -> StepEvidence:
        b64 = None
        if screenshot_bytes:
            b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            # Also save file
            img_path = os.path.join(self.run_dir, f"step_{step_number}.png")
            with open(img_path, "wb") as f:
                f.write(screenshot_bytes)

        ev = StepEvidence(
            step_number=step_number,
            url=url,
            action_type=action_type,
            semantic_target=semantic_target,
            latency_ms=latency_ms,
            timestamp=__import__('time').time(),
            screenshot_base64=b64,
            state_id=state_id,
            finding_ids=finding_ids or []
        )
        self.steps.append(ev)
        return ev

    def export_summary(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "total_steps": len(self.steps),
            "steps": [s.model_dump() for s in self.steps]
        }
