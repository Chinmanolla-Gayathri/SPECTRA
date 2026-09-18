"""
SPECTRA - UX Friction Index Engine
Computes objective weighted formula:
Interaction Cost + Temporal Cost + Navigation Cost + Accessibility Cost -> SPECTRA UX Friction Index (0-100 scale).
"""
from typing import Dict, Any
from ..ai.schemas import FrictionMetrics

class FrictionEngine:
    """
    Formulates objective, reproducible UX Friction measurements:
    - Interaction Cost: (Clicks * 1.5) + (Scrolls * 0.8) + (Inputs * 2.0)
    - Temporal Cost: (Duration_Seconds / 3.0)
    - Navigation Cost: (Backtracks * 5.0) + (Dead_Ends * 15.0) + (Loops * 20.0)
    - Accessibility Cost: (Critical * 10.0) + (High * 6.0) + (Medium * 3.0) + (Low * 1.0)
    All components normalized into a 0 - 100 SPECTRA UX Friction Index.
    """
    def __init__(self):
        pass

    def calculate(
        self,
        clicks: int,
        scrolls: int,
        inputs: int,
        duration_sec: float,
        backtracks: int,
        dead_ends: int,
        loops: int,
        wcag_violations: Dict[str, int]
    ) -> FrictionMetrics:
        # Interaction Cost (Baseline optimal is ~5-8 interactions)
        interaction_raw = (clicks * 1.5) + (scrolls * 0.8) + (inputs * 2.0)
        interaction_cost = round(min(30.0, interaction_raw * 1.2), 1)

        # Temporal Cost (Time spent vs expected optimal task duration ~15s)
        temporal_cost = round(min(25.0, (duration_sec / 20.0) * 15.0), 1)

        # Navigation Cost (Penalty for wasted cognitive & motor effort)
        navigation_raw = (backtracks * 6.0) + (dead_ends * 15.0) + (loops * 20.0)
        navigation_cost = round(min(25.0, navigation_raw), 1)

        # Accessibility Cost
        crit = wcag_violations.get("CRITICAL", 0) * 8.0
        high = wcag_violations.get("HIGH", 0) * 5.0
        med = wcag_violations.get("MEDIUM", 0) * 2.5
        low = wcag_violations.get("LOW", 0) * 1.0
        a11y_cost = round(min(20.0, crit + high + med + low), 1)

        # Total SPECTRA UX Friction Index (0 = effortless, 100 = extreme friction)
        total_friction = round(min(100.0, interaction_cost + temporal_cost + navigation_cost + a11y_cost), 1)

        return FrictionMetrics(
            interaction_cost=interaction_cost,
            temporal_cost=temporal_cost,
            navigation_cost=navigation_cost,
            accessibility_cost=a11y_cost,
            spectra_friction_index=total_friction,
            click_count=clicks,
            scroll_count=scrolls,
            input_count=inputs,
            total_duration_sec=round(duration_sec, 2),
            backtrack_count=backtracks,
            dead_end_count=dead_ends,
            wcag_violations_count=sum(wcag_violations.values())
        )
