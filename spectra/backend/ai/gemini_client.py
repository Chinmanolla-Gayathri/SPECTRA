"""
SPECTRA - Gemini 3.8 Flash Client
Wrapper for Google GenAI API with exponential backoff, rate limit handling, structured JSON parsing, and accounting.
"""
import os
import json
import time
import asyncio
from typing import Optional, Dict, Any, Type, TypeVar
from pydantic import BaseModel
from dotenv import load_dotenv

from .cache import global_cache

load_dotenv()

T = TypeVar("T", bound=BaseModel)

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self.request_count = 0
        self.total_tokens_estimated = 0

    async def generate_structured(
        self,
        system_instruction: str,
        prompt: str,
        response_model: Type[T],
        image_bytes: Optional[bytes] = None,
        max_retries: int = 3
    ) -> T:
        """
        Calls Gemini 3.8 Flash with exponential backoff and parses the response into response_model.
        """
        # 1. Check cache
        cached = global_cache.get(self.model_name, f"{system_instruction}::{prompt}", image_bytes)
        if cached:
            return response_model.model_validate(cached)

        # In Python environment or demo mode fallback
        retries = 0
        backoff = 1.0

        while retries < max_retries:
            try:
                self.request_count += 1
                
                # If google-genai is installed in python
                try:
                    from google import genai
                    from google.genai import types
                    client = genai.Client(api_key=self.api_key)
                    
                    contents = []
                    if image_bytes:
                        contents.append(
                            types.Part.from_bytes(
                                data=image_bytes,
                                mime_type="image/png"
                            )
                        )
                    contents.append(prompt)

                    response = client.models.generate_content(
                        model=self.model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_mime_type="application/json",
                            temperature=0.2,
                        ),
                    )
                    raw_text = response.text or "{}"
                    data = json.loads(raw_text)
                    validated = response_model.model_validate(data)
                    global_cache.set(self.model_name, f"{system_instruction}::{prompt}", validated.model_dump(), image_bytes)
                    return validated
                except ImportError:
                    # Deterministic mock fallback when Python genai package is not present in local CLI
                    data = self._simulate_response(system_instruction, prompt)
                    validated = response_model.model_validate(data)
                    return validated

            except Exception as e:
                retries += 1
                if retries >= max_retries:
                    raise RuntimeError(f"Gemini API failed after {max_retries} attempts: {str(e)}")
                await asyncio.sleep(backoff)
                backoff *= 2.0

        raise RuntimeError("Failed to generate response")

    def _simulate_response(self, system_instruction: str, prompt: str) -> Dict[str, Any]:
        """Deterministic simulation for offline testing or demo mode"""
        p_lower = prompt.lower()
        if "goal parser" in system_instruction.lower():
            return {
                "raw_goal": prompt,
                "entry_url": "http://localhost:3000/demo-app",
                "success_criteria": [
                    "Locate running shoes collection",
                    "Filter or select blue running shoes under ₹5000",
                    "Add selected item to cart",
                    "Proceed to guest checkout screen"
                ],
                "constraints": ["No account creation", "Do not exceed price ₹5000"],
                "max_steps": 15,
                "max_paths": 3,
                "exploration_enabled": True,
                "target_keywords": ["blue", "shoes", "running", "cart", "checkout", "guest"]
            }
        elif "action selector" in system_instruction.lower():
            if "cart" in p_lower or "checkout" in p_lower:
                return {
                    "action_type": "click",
                    "semantic_target": "Checkout as Guest button",
                    "input_text": None,
                    "scroll_delta_y": None,
                    "confidence": 0.94,
                    "reasoning": "Observed guest checkout CTA directly satisfies checkout criteria.",
                    "requires_confirmation": False,
                    "estimated_success_prob": 0.92
                }
            return {
                "action_type": "click",
                "semantic_target": "Blue Running Shoes ₹4299 Card",
                "input_text": None,
                "scroll_delta_y": None,
                "confidence": 0.92,
                "reasoning": "Item matches target attributes (blue, running shoe, under ₹5000).",
                "requires_confirmation": False,
                "estimated_success_prob": 0.88
            }
        elif "goal verification" in system_instruction.lower():
            return {
                "goal_reached": "checkout" in p_lower or "guest" in p_lower,
                "confidence": 0.95,
                "evidence": "Guest checkout page heading and cart summary detected.",
                "remaining_criteria": []
            }
        elif "ux/ui auditor" in system_instruction.lower():
            return {
                "findings": [
                    {
                        "id": "UX-F01",
                        "category": "AI_INFERRED",
                        "severity": "MEDIUM",
                        "title": "Subtle Guest Checkout Secondary Link",
                        "description": "Guest checkout is rendered in low contrast text below the primary Sign In button, increasing cognitive load for first-time shoppers.",
                        "recommendation": "Elevate Guest Checkout to a distinct secondary button with clear borders.",
                        "confidence": 0.88
                    }
                ]
            }
        return {}
