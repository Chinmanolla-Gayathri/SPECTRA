"""
SPECTRA - Observation State Model
Deterministic State ID generation via URL, normalized text, and accessibility tree structure.
"""
import hashlib
from typing import List, Optional
from pydantic import BaseModel, Field
from ..ai.schemas import UIElementCandidate, StateMachineState

class ObservationState(BaseModel):
    state_id: str
    url: str
    title: str
    step_number: int
    normalized_text_hash: str
    a11y_tree_hash: str
    status: StateMachineState = "NORMAL"
    candidates: List[UIElementCandidate] = Field(default_factory=list)
    screenshot_path: Optional[str] = None
    view_summary: Optional[str] = None

    @classmethod
    def compute_state_id(cls, url: str, normalized_text: str, a11y_structure: str) -> str:
        """
        Deterministic state hashing: H(URL, normalized text, a11y tree structure)
        """
        h = hashlib.sha256()
        h.update(url.strip().lower().encode('utf-8'))
        h.update(normalized_text.strip().lower().encode('utf-8'))
        h.update(a11y_structure.strip().encode('utf-8'))
        return f"node_{h.hexdigest()[:12]}"
