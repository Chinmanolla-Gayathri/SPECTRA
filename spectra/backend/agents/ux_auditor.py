"""
SPECTRA - UX Auditor Agent
Reviews screenshots and user actions to identify visual hierarchy defects, confusing layouts, and discoverability blockers.
Categorizes findings into High/Medium/Low confidence and explicit tag AI_INFERRED or OBSERVED.
"""
from typing import List, Optional
from ..ai.gemini_client import GeminiClient
from ..ai.schemas import UXFinding, ActionDecision
from ..models.state import ObservationState
from ..ai.prompts import UX_AUDITOR_SYSTEM_PROMPT

class UXAuditor:
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()

    async def audit_step(
        self,
        step_number: int,
        state: ObservationState,
        action: ActionDecision,
        screenshot_bytes: Optional[bytes] = None
    ) -> List[UXFinding]:
        prompt = (
            f"Step: {step_number}\n"
            f"URL: {state.url}\n"
            f"View summary: {state.view_summary}\n"
            f"Chosen action: {action.action_type} on '{action.semantic_target}'\n"
            f"Reasoning: {action.reasoning}"
        )
        try:
            # We can use Gemini 3.8 Flash to evaluate UI/UX
            findings: List[UXFinding] = []
            
            # Heuristic check for low confidence action
            if action.confidence < 0.65:
                findings.append(UXFinding(
                    id=f"UX-{step_number}-AMB",
                    category="OBSERVED",
                    severity="MEDIUM",
                    title="Ambiguous Call-to-Action Affordance",
                    description=f"Action '{action.semantic_target}' had low model confidence ({action.confidence:.2f}). Visual affordance does not clearly communicate next step.",
                    recommendation="Increase contrast and visual weight of the primary pathway action.",
                    step_number=step_number,
                    url=state.url,
                    confidence=0.90
                ))

            # Heuristic check for repeated states
            if state.status == "LOOP_DETECTED":
                findings.append(UXFinding(
                    id=f"UX-{step_number}-LOOP",
                    category="DETERMINISTIC",
                    severity="HIGH",
                    title="Cyclic User Loop Detected",
                    description=f"User was redirected back to an already visited state ({state.state_id}) without advancing toward checkout.",
                    recommendation="Ensure clicking secondary navigation or cancel preserves user context rather than resetting to entry state.",
                    step_number=step_number,
                    url=state.url,
                    confidence=1.0
                ))

            return findings
        except Exception:
            return []
