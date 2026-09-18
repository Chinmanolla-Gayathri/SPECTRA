"""
SPECTRA - Pydantic Data Schemas for Gemini 3.8 Flash and Orchestration
"""
from typing import List, Optional, Literal, Dict, Any

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self):
            return self.__dict__
    def Field(default=None, default_factory=None, **kwargs):
        if default_factory is not None:
            return default_factory()
        return default

FindingType = Literal["DETERMINISTIC", "OBSERVED", "AI_INFERRED"]
SeverityType = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]
ActionType = Literal["click", "type", "scroll", "press", "hover", "back", "wait"]
StateMachineState = Literal[
    "NORMAL",
    "GOAL_REACHED",
    "RECOVERABLE_ERROR",
    "DEAD_END",
    "LOOP_DETECTED",
    "BLOCKED",
    "UNEXPECTED_STATE"
]

class BoundingBox(BaseModel):
    x: float = Field(..., description="Normalized X coordinate 0-1000")
    y: float = Field(..., description="Normalized Y coordinate 0-1000")
    width: float = Field(..., description="Normalized width 0-1000")
    height: float = Field(..., description="Normalized height 0-1000")

class UIElementCandidate(BaseModel):
    id: str
    tag: str
    role: Optional[str] = None
    text: str
    accessible_name: Optional[str] = None
    bbox: BoundingBox
    interactive: bool = True
    confidence: float = 1.0

class ParsedGoal(BaseModel):
    raw_goal: str
    entry_url: str
    success_criteria: List[str]
    constraints: List[str] = Field(default_factory=list)
    max_steps: int = 15
    max_paths: int = 3
    exploration_enabled: bool = True
    target_keywords: List[str] = Field(default_factory=list)

class ActionDecision(BaseModel):
    action_type: ActionType
    semantic_target: str = Field(..., description="Human/AI description of target element e.g. 'blue shoes card'")
    input_text: Optional[str] = None
    scroll_delta_y: Optional[int] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(..., description="Concise explanation for choosing this action")
    requires_confirmation: bool = False
    estimated_success_prob: float = Field(default=0.7, ge=0.0, le=1.0)

class GoalCheckResult(BaseModel):
    goal_reached: bool
    confidence: float
    evidence: str
    remaining_criteria: List[str]

class UXFinding(BaseModel):
    id: str
    category: FindingType
    severity: SeverityType
    title: str
    description: str
    recommendation: str
    step_number: int
    url: str
    screenshot_ref: Optional[str] = None
    dom_selector: Optional[str] = None
    confidence: float = 1.0

class FrictionMetrics(BaseModel):
    interaction_cost: float
    temporal_cost: float
    navigation_cost: float
    accessibility_cost: float
    spectra_friction_index: float
    click_count: int
    scroll_count: int
    input_count: int
    total_duration_sec: float
    backtrack_count: int
    dead_end_count: int
    wcag_violations_count: int
