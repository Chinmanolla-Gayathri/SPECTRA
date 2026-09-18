"""
SPECTRA - Loop Detector
Tracks traversal history to detect deterministic cycles and dead ends.
"""
from typing import List, Tuple

class LoopDetector:
    def __init__(self, cycle_threshold: int = 2):
        self.cycle_threshold = cycle_threshold
        self.history: List[str] = []

    def record_visit(self, state_id: str) -> Tuple[bool, str]:
        self.history.append(state_id)
        
        # Check consecutive repetition
        if len(self.history) >= 2 and self.history[-1] == self.history[-2]:
            return True, f"Consecutive identical state visit: {state_id}"

        # Check cyclic alternation A -> B -> A -> B
        if len(self.history) >= 4:
            if self.history[-1] == self.history[-3] and self.history[-2] == self.history[-4]:
                return True, f"Ping-pong cycle detected between states {self.history[-1]} and {self.history[-2]}"

        # Check total visits
        count = self.history.count(state_id)
        if count > self.cycle_threshold:
            return True, f"State {state_id} visited {count} times (threshold {self.cycle_threshold})"

        return False, ""
