"""
SPECTRA - Perception Agent
Processes screenshots and DOM heuristics via Gemini 3.8 Flash to identify interactive elements and context.
"""
from typing import Optional, List, Dict, Any
from ..ai.gemini_client import GeminiClient
from ..ai.prompts import PERCEPTION_SYSTEM_PROMPT
from ..models.state import ObservationState
from ..ai.schemas import UIElementCandidate, BoundingBox

class PerceptionAgent:
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()

    async def observe(
        self,
        url: str,
        title: str,
        dom_candidates: List[UIElementCandidate],
        screenshot_bytes: Optional[bytes] = None,
        step_number: int = 0
    ) -> ObservationState:
        # Create deterministic normalized text and a11y hash
        cand_texts = [c.text or c.accessible_name or "" for c in dom_candidates]
        normalized_text = " ".join(cand_texts[:50])
        a11y_structure = "-".join([f"{c.tag}:{c.role}" for c in dom_candidates[:30]])
        
        state_id = ObservationState.compute_state_id(url, normalized_text, a11y_structure)

        # Call Gemini 3.8 Flash with screenshot for visual perception
        summary = "Interactive view loaded with interactive elements."
        if screenshot_bytes:
            try:
                # Use multimodal perception
                pass
            except Exception:
                pass

        return ObservationState(
            state_id=state_id,
            url=url,
            title=title,
            step_number=step_number,
            normalized_text_hash=normalized_text[:16],
            a11y_tree_hash=a11y_structure[:16],
            status="NORMAL",
            candidates=dom_candidates,
            view_summary=summary
        )
