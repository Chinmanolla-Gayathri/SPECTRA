"""
SPECTRA - Playwright Browser Controller
Provides safe typed actions, black-box visual captures, DOM candidate extraction, and accessibility tree integration.
"""
import asyncio
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from ..ai.schemas import UIElementCandidate, BoundingBox

class ClickAction(BaseModel):
    x: float
    y: float
    selector: Optional[str] = None

class TypeAction(BaseModel):
    x: float
    y: float
    text: str
    press_enter: bool = True

class ScrollAction(BaseModel):
    delta_y: int

class PressAction(BaseModel):
    key: str

class HoverAction(BaseModel):
    x: float
    y: float

class BackAction(BaseModel):
    pass

class WaitAction(BaseModel):
    seconds: float = 1.0

class BrowserController:
    """
    Playwright controller wrapper with graceful fallbacks for mock/demo environments.
    """
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser = None
        self.context = None
        self.page = None
        self._is_active = False

    async def start(self):
        try:
            from playwright.async_api import async_playwright
            self.p = await async_playwright().start()
            self.browser = await self.p.chromium.launch(headless=self.headless)
            self.context = await self.browser.new_context(
                viewport={"width": 1280, "height": 800},
                device_scale_factor=1,
            )
            self.page = await self.context.new_page()
            self._is_active = True
        except Exception:
            # Fallback simulator mode
            self._is_active = False

    async def goto(self, url: str):
        if self.page:
            await self.page.goto(url, wait_until="networkidle", timeout=15000)
        await asyncio.sleep(0.5)

    async def capture_screenshot(self) -> bytes:
        if self.page:
            return await self.page.screenshot(type="png", full_page=False)
        # 1x1 fallback png
        return b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    async def get_interactive_candidates(self) -> List[UIElementCandidate]:
        if not self.page:
            return [
                UIElementCandidate(
                    id="sim-1",
                    tag="a",
                    role="link",
                    text="Men's Running Shoes",
                    accessible_name="Men's Running Shoes",
                    bbox=BoundingBox(x=200, y=180, width=200, height=40),
                    interactive=True,
                    confidence=1.0
                ),
                UIElementCandidate(
                    id="sim-2",
                    tag="button",
                    role="button",
                    text="Filter by Color: Blue",
                    accessible_name="Filter by Color: Blue",
                    bbox=BoundingBox(x=100, y=260, width=150, height=35),
                    interactive=True,
                    confidence=0.95
                ),
                UIElementCandidate(
                    id="sim-3",
                    tag="div",
                    role="article",
                    text="Apex Velocity Blue - ₹4,499",
                    accessible_name="Apex Velocity Blue Running Shoe",
                    bbox=BoundingBox(x=350, y=320, width=280, height=320),
                    interactive=True,
                    confidence=0.98
                )
            ]

        # Extract DOM candidates via Playwright evaluation
        script = """
        () => {
            const elements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"], [onclick]'));
            return elements.map((el, i) => {
                const rect = el.getBoundingClientRect();
                return {
                    id: 'dom-' + i,
                    tag: el.tagName.toLowerCase(),
                    role: el.getAttribute('role') || el.tagName.toLowerCase(),
                    text: (el.innerText || el.value || '').trim().slice(0, 100),
                    accessible_name: el.getAttribute('aria-label') || el.title || el.alt || (el.innerText || '').trim(),
                    bbox: {
                        x: Math.max(0, rect.x),
                        y: Math.max(0, rect.y),
                        width: Math.max(0, rect.width),
                        height: Math.max(0, rect.height)
                    },
                    interactive: true,
                    confidence: 1.0
                };
            }).filter(e => e.bbox.width > 5 && e.bbox.height > 5 && (e.text || e.accessible_name));
        }
        """
        raw = await self.page.evaluate(script)
        candidates = []
        for item in raw:
            candidates.append(UIElementCandidate(**item))
        return candidates

    async def execute_click(self, action: ClickAction):
        if self.page:
            await self.page.mouse.click(action.x, action.y)
        await asyncio.sleep(0.5)

    async def execute_type(self, action: TypeAction):
        if self.page:
            await self.page.mouse.click(action.x, action.y)
            await self.page.keyboard.type(action.text)
            if action.press_enter:
                await self.page.keyboard.press("Enter")
        await asyncio.sleep(0.5)

    async def execute_scroll(self, action: ScrollAction):
        if self.page:
            await self.page.mouse.wheel(0, action.delta_y)
        await asyncio.sleep(0.3)

    async def execute_back(self):
        if self.page:
            await self.page.go_back()
        await asyncio.sleep(0.5)

    async def close(self):
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'p') and self.p:
            await self.p.stop()
