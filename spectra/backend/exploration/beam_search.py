"""
SPECTRA - Bounded Beam Search Explorer
Prioritizes exploratory paths using the exact mathematical heuristic formula:
priority = 0.35*goal_relevance + 0.25*novelty + 0.20*estimated_success + 0.20*unexplored_coverage
"""
import math
from typing import List, Dict, Any, Optional
from ..ai.schemas import BaseModel, Field

class ExplorationCandidate(BaseModel):
    path_id: int
    action_description: str
    target_semantic: str
    goal_relevance: float = Field(..., ge=0.0, le=1.0)
    novelty: float = Field(..., ge=0.0, le=1.0)
    estimated_success: float = Field(..., ge=0.0, le=1.0)
    unexplored_coverage: float = Field(..., ge=0.0, le=1.0)
    priority: float = 0.0

    def compute_priority(self) -> float:
        """
        SPECTRA Priority Heuristic Formula:
        priority = 0.35*goal_relevance + 0.25*novelty + 0.20*estimated_success + 0.20*unexplored_coverage
        """
        self.priority = (
            0.35 * self.goal_relevance +
            0.25 * self.novelty +
            0.20 * self.estimated_success +
            0.20 * self.unexplored_coverage
        )
        return self.priority

class BeamSearchExplorer:
    def __init__(
        self,
        max_paths: int = 3,
        max_steps_per_path: int = 15,
        beam_width: int = 3
    ):
        self.max_paths = max_paths
        self.max_steps_per_path = max_steps_per_path
        self.beam_width = beam_width
        self.active_paths: List[Dict[str, Any]] = []

    def rank_candidates(self, candidates: List[ExplorationCandidate]) -> List[ExplorationCandidate]:
        for c in candidates:
            c.compute_priority()
        # Sort descending by priority
        ranked = sorted(candidates, key=lambda x: x.priority, reverse=True)
        return ranked[:self.beam_width]
