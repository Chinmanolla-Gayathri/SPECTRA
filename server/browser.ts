/**
 * SPECTRA - Real Playwright Browser Controller
 * Provides real headless Chromium navigation, screenshot capture, DOM candidate extraction,
 * deterministic accessibility checks, and action execution.
 */
import { chromium, Browser, BrowserContext, Page } from "playwright";

export interface DOMElementCandidate {
  id: string;
  tag: string;
  role?: string;
  text: string;
  accessibleName?: string;
  selector: string;
  bbox: { x: number; y: number; width: number; height: number };
  interactive: boolean;
}

export interface DeterministicFinding {
  id: string;
  category: "DETERMINISTIC";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  description: string;
  recommendation: string;
  dom_selector?: string;
  wcag_rule?: string;
  confidence: number;
}

export class RealBrowserController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  public page: Page | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.page) return;
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--no-zygote",
        ],
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SPECTRA/1.0",
      });
      this.page = await this.context.newPage();
      this.isInitialized = true;
    } catch (err: any) {
      throw new Error(`Failed to launch browser engine: ${err.message}`);
    }
  }

  async navigate(url: string): Promise<{ title: string; currentUrl: string }> {
    await this.init();
    if (!this.page) throw new Error("Browser page not initialized");

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      await this.page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
      // Allow dynamic frameworks (React/Next/SPA) a moment to render
      await this.page.waitForTimeout(1000);
      const title = await this.page.title();
      const currentUrl = this.page.url();
      return { title: title || targetUrl, currentUrl };
    } catch (err: any) {
      throw new Error(`Unable to navigate to ${url}: ${err.message}`);
    }
  }

  async captureScreenshot(): Promise<string> {
    if (!this.page) return "";
    try {
      const buffer = await this.page.screenshot({
        type: "jpeg",
        quality: 75,
        fullPage: false,
      });
      return `data:image/jpeg;base64,${buffer.toString("base64")}`;
    } catch (e) {
      return "";
    }
  }

  async extractInteractiveElements(): Promise<DOMElementCandidate[]> {
    if (!this.page) return [];
    try {
      const elements = await this.page.evaluate(() => {
        const results: any[] = [];
        const seen = new Set<string>();

        const candidates = document.querySelectorAll(
          'a, button, input, select, textarea, [role="button"], [role="link"], [role="searchbox"], [role="menuitem"], [tabindex="0"], h1, h2'
        );

        let counter = 0;
        for (let i = 0; i < candidates.length && counter < 40; i++) {
          const el = candidates[i] as HTMLElement;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;

          // Check if visible
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

          const text = (el.innerText || el.textContent || (el as HTMLInputElement).value || "").trim().slice(0, 60);
          const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("title") || "";
          const role = el.getAttribute("role") || el.tagName.toLowerCase();

          // Construct a distinct CSS selector
          let selector = el.tagName.toLowerCase();
          if (el.id) {
            selector += `#${el.id}`;
          } else if (el.className && typeof el.className === "string") {
            const classes = el.className.split(/\s+/).filter(c => c && !c.includes(":") && !c.includes("/")).slice(0, 2);
            if (classes.length > 0) selector += `.${classes.join(".")}`;
          }

          const signature = `${el.tagName}:${text}:${ariaLabel}`;
          if (seen.has(signature)) continue;
          seen.add(signature);
          counter++;

          results.push({
            id: `elem_${counter}`,
            tag: el.tagName.toLowerCase(),
            role: role,
            text: text,
            accessibleName: ariaLabel || text,
            selector: selector,
            bbox: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            interactive: ["a", "button", "input", "select", "textarea"].includes(el.tagName.toLowerCase()) || el.getAttribute("role") === "button"
          });
        }
        return results;
      });

      return elements;
    } catch (err) {
      return [];
    }
  }

  async runDeterministicAccessibilityAudit(): Promise<DeterministicFinding[]> {
    if (!this.page) return [];
    try {
      const findings = await this.page.evaluate(() => {
        const issues: any[] = [];
        let issueId = 1;

        // 1. Buttons without accessible name
        const buttons = document.querySelectorAll("button, [role='button']");
        buttons.forEach((btn) => {
          const text = (btn.textContent || "").trim();
          const aria = btn.getAttribute("aria-label") || btn.getAttribute("aria-labelledby") || btn.getAttribute("title");
          if (!text && !aria) {
            issues.push({
              id: `DET-A11Y-${issueId++}`,
              category: "DETERMINISTIC",
              severity: "HIGH",
              title: "WCAG 2.1 SC 4.1.2: Interactive button missing accessible name",
              description: `Button element renders without inner text, aria-label, or title attribute.`,
              recommendation: `Provide a descriptive aria-label or visible text inside the button.`,
              dom_selector: btn.tagName.toLowerCase() + (btn.className ? `.${btn.className.split(' ')[0]}` : ""),
              wcag_rule: "WCAG 4.1.2 Name, Role, Value",
              confidence: 1.0,
            });
          }
        });

        // 2. Images missing alt attribute
        const images = document.querySelectorAll("img");
        images.forEach((img) => {
          if (!img.hasAttribute("alt")) {
            issues.push({
              id: `DET-A11Y-${issueId++}`,
              category: "DETERMINISTIC",
              severity: "MEDIUM",
              title: "WCAG 2.1 SC 1.1.1: Image missing alt attribute",
              description: `Image element <img src="${(img.src || "").slice(0, 40)}..."> lacks an alt attribute.`,
              recommendation: `Add alt="descriptive text" or alt="" if the image is purely decorative.`,
              dom_selector: "img",
              wcag_rule: "WCAG 1.1.1 Non-text Content",
              confidence: 1.0,
            });
          }
        });

        // 3. Inputs missing accessible label
        const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit'])");
        inputs.forEach((input) => {
          const id = input.id;
          const hasLabel = id ? document.querySelector(`label[for='${id}']`) : null;
          const aria = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby") || input.getAttribute("placeholder");
          if (!hasLabel && !aria) {
            issues.push({
              id: `DET-A11Y-${issueId++}`,
              category: "DETERMINISTIC",
              severity: "HIGH",
              title: "WCAG 2.1 SC 1.3.1: Form input missing associated label",
              description: `Input field lacks an associated <label for="..."> and has no aria-label.`,
              recommendation: `Associate a <label> element or apply aria-label to this input.`,
              dom_selector: `input${id ? '#' + id : ''}`,
              wcag_rule: "WCAG 1.3.1 Info and Relationships",
              confidence: 1.0,
            });
          }
        });

        // 4. Links without text
        const links = document.querySelectorAll("a[href]");
        links.forEach((link) => {
          const text = (link.textContent || "").trim();
          const aria = link.getAttribute("aria-label");
          const img = link.querySelector("img[alt]");
          if (!text && !aria && !img) {
            issues.push({
              id: `DET-A11Y-${issueId++}`,
              category: "DETERMINISTIC",
              severity: "MEDIUM",
              title: "WCAG 2.1 SC 2.4.4: Link purpose missing or empty text",
              description: `Anchor element links to "${(link.getAttribute('href') || '').slice(0, 30)}" with no accessible text.`,
              recommendation: `Ensure link contains descriptive text or an aria-label attribute.`,
              dom_selector: "a",
              wcag_rule: "WCAG 2.4.4 Link Purpose",
              confidence: 0.95,
            });
          }
        });

        return issues.slice(0, 5); // top 5 findings per step
      });

      return findings;
    } catch (e) {
      return [];
    }
  }

  async executeAction(action: {
    type: string;
    target?: string;
    selector?: string;
    text?: string;
    delta_y?: number;
    cursor_pos?: { x: number; y: number };
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.page) return { success: false, error: "Browser not active" };

    try {
      if (action.type === "click") {
        if (action.cursor_pos && action.cursor_pos.x > 0 && action.cursor_pos.y > 0) {
          await this.page.mouse.click(action.cursor_pos.x, action.cursor_pos.y);
        } else if (action.selector) {
          const el = this.page.locator(action.selector).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await el.click({ timeout: 3000 });
          } else if (action.target) {
            await this.page.getByText(action.target, { exact: false }).first().click({ timeout: 3000 });
          }
        } else if (action.target) {
          const byText = this.page.getByText(action.target, { exact: false }).first();
          await byText.click({ timeout: 3000 });
        }
      } else if (action.type === "type" && action.text) {
        if (action.selector) {
          const input = this.page.locator(action.selector).first();
          await input.fill(action.text, { timeout: 3000 });
          await this.page.keyboard.press("Enter");
        } else {
          // Try to find any active/visible input
          const input = this.page.locator("input[type='text'], input[type='search'], input:not([type='hidden'])").first();
          await input.fill(action.text, { timeout: 3000 });
          await this.page.keyboard.press("Enter");
        }
      } else if (action.type === "scroll") {
        const delta = action.delta_y || 400;
        await this.page.mouse.wheel(0, delta);
      } else if (action.type === "back") {
        await this.page.goBack({ timeout: 5000 }).catch(() => {});
      } else if (action.type === "wait") {
        await this.page.waitForTimeout(1500);
      }

      // Wait a moment for dynamic page response
      await this.page.waitForTimeout(1000);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async close(): Promise<void> {
    try {
      if (this.context) await this.context.close().catch(() => {});
      if (this.browser) await this.browser.close().catch(() => {});
    } catch (e) {
      // ignore
    } finally {
      this.page = null;
      this.context = null;
      this.browser = null;
      this.isInitialized = false;
    }
  }
}
