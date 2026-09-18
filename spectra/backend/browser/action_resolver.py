"""
SPECTRA - Action Resolver
Matches high-level semantic AI targets to concrete DOM candidates via accessible name, visible text, role, and coordinates.
Enforces confidence thresholds and action safety policy.
"""
import re
from typing import List, Optional, Tuple
from ..ai.schemas import UIElementCandidate, ActionDecision

DESTRUCTIVE_KEYWORDS = [
    "delete account", "remove payment", "buy now", "place order", 
    "confirm purchase", "pay now", "format", "terminate", "wipe data"
]

class ActionResolver:
    def __init__(self, confidence_threshold: float = 0.55):
        self.confidence_threshold = confidence_threshold

    def check_safety_policy(self, decision: ActionDecision) -> bool:
        """
        Returns True if action is safe to execute autonomously.
        Returns False if action requires human confirmation.
        """
        target_lower = decision.semantic_target.lower()
        if decision.requires_confirmation:
            return False
        for kw in DESTRUCTIVE_KEYWORDS:
            if kw in target_lower:
                return False
        return True

    def resolve(
        self, 
        decision: ActionDecision, 
        candidates: List[UIElementCandidate]
    ) -> Tuple[Optional[UIElementCandidate], float, str]:
        """
        Resolves semantic target to best matching DOM candidate.
        Returns (best_candidate, match_score, explanation).
        """
        if not candidates:
            return None, 0.0, "No interactive candidates available on page"

        target_text = decision.semantic_target.lower()
        target_tokens = set(re.findall(r'\w+', target_text))

        best_cand: Optional[UIElementCandidate] = None
        best_score = 0.0

        for cand in candidates:
            score = 0.0
            cand_text = (cand.text or "").lower()
            cand_name = (cand.accessible_name or "").lower()
            cand_role = (cand.role or "").lower()
            combined = f"{cand_text} {cand_name} {cand_role}"

            # Exact text match
            if target_text in cand_text or target_text in cand_name:
                score += 0.8
            
            # Token overlap
            cand_tokens = set(re.findall(r'\w+', combined))
            if target_tokens and cand_tokens:
                overlap = len(target_tokens.intersection(cand_tokens)) / len(target_tokens)
                score += overlap * 0.6

            # Role bonus
            if "button" in target_text and cand_role in ["button", "link"]:
                score += 0.2
            elif "input" in target_text and cand_role in ["textbox", "searchbox", "input"]:
                score += 0.2

            score = min(1.0, score * cand.confidence)

            if score > best_score:
                best_score = score
                best_cand = cand

        if best_score < self.confidence_threshold:
            return best_cand, best_score, f"Best match score ({best_score:.2f}) below threshold ({self.confidence_threshold})"

        return best_cand, best_score, f"Resolved to candidate '{best_cand.text or best_cand.accessible_name}' (score {best_score:.2f})"
