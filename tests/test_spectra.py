"""
SPECTRA - Verification Tests for Core Framework
Tests:
1. Pydantic Schemas and Action Decision
2. Priority Heuristic calculation formula
3. Deterministic UX Friction Index formula
4. Loop Detection logic
5. Action Resolver safety policy
"""
import sys
from spectra.backend.ai.schemas import ActionDecision, ParsedGoal
from spectra.backend.exploration.beam_search import ExplorationCandidate
from spectra.backend.exploration.loop_detector import LoopDetector
from spectra.backend.evaluation.friction import FrictionEngine
from spectra.backend.browser.action_resolver import ActionResolver

def test_priority_heuristic_formula():
    """
    Validates: priority = 0.35*goal_relevance + 0.25*novelty + 0.20*estimated_success + 0.20*unexplored_coverage
    """
    cand = ExplorationCandidate(
        path_id=1,
        action_description="Click blue shoe card",
        target_semantic="Apex Velocity Blue",
        goal_relevance=1.0,
        novelty=0.8,
        estimated_success=0.9,
        unexplored_coverage=0.5
    )
    p = cand.compute_priority()
    expected = (0.35 * 1.0) + (0.25 * 0.8) + (0.20 * 0.9) + (0.20 * 0.5)
    assert abs(p - expected) < 1e-5
    assert round(p, 2) == 0.83

def test_friction_engine_calculation():
    """
    Validates objective friction index computation
    """
    engine = FrictionEngine()
    metrics = engine.calculate(
        clicks=4,
        scrolls=2,
        inputs=1,
        duration_sec=18.5,
        backtracks=0,
        dead_ends=0,
        loops=0,
        wcag_violations={"CRITICAL": 0, "HIGH": 1, "MEDIUM": 1, "LOW": 0}
    )
    assert metrics.spectra_friction_index > 0
    assert metrics.click_count == 4
    assert metrics.interaction_cost > 0
    assert metrics.accessibility_cost > 0

def test_loop_detector_cycle():
    """
    Validates cycle detection on ping-pong states
    """
    detector = LoopDetector()
    is_loop, _ = detector.record_visit("state_A")
    assert not is_loop
    is_loop, _ = detector.record_visit("state_B")
    assert not is_loop
    is_loop, _ = detector.record_visit("state_A")
    assert not is_loop
    is_loop, reason = detector.record_visit("state_B")
    assert is_loop
    assert "ping-pong" in reason.lower()

def test_action_resolver_safety_policy():
    """
    Validates safety policy blocks destructive actions autonomously
    """
    resolver = ActionResolver()
    safe_action = ActionDecision(
        action_type="click",
        semantic_target="Add to Bag",
        confidence=0.95,
        reasoning="Selecting product"
    )
    assert resolver.check_safety_policy(safe_action) is True

    unsafe_action = ActionDecision(
        action_type="click",
        semantic_target="Delete Account and Purge Data",
        confidence=0.95,
        reasoning="Clearing settings"
    )
    assert resolver.check_safety_policy(unsafe_action) is False

if __name__ == "__main__":
    print("Running SPECTRA Unit & Algorithmic Verification Tests...")
    test_priority_heuristic_formula()
    print("✓ Priority Heuristic Formula passed")
    test_friction_engine_calculation()
    print("✓ Friction Engine calculation passed")
    test_loop_detector_cycle()
    print("✓ Loop Detector cycle logic passed")
    test_action_resolver_safety_policy()
    print("✓ Action Resolver Safety Policy passed")
    print("\nALL SPECTRA TESTS PASSED (4/4)!")
