"""
SPECTRA - Goal Parser Agent
Converts natural-language testing goals into structured execution contracts.
"""
from typing import Optional
from ..ai.gemini_client import GeminiClient
from ..ai.schemas import ParsedGoal
from ..ai.prompts import GOAL_PARSER_SYSTEM_PROMPT

class GoalParser:
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()

    async def parse(self, raw_goal: str, entry_url: str, max_steps: int = 15, max_paths: int = 3) -> ParsedGoal:
        prompt = f"Goal: {raw_goal}\nEntry URL: {entry_url}\nMax Steps: {max_steps}\nMax Paths: {max_paths}"
        parsed = await self.client.generate_structured(
            system_instruction=GOAL_PARSER_SYSTEM_PROMPT,
            prompt=prompt,
            response_model=ParsedGoal
        )
        # Ensure non-empty fallback
        parsed.raw_goal = raw_goal
        parsed.entry_url = entry_url
        if not parsed.success_criteria:
            parsed.success_criteria = [raw_goal]
        return parsed
