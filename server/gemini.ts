/**
 * SPECTRA - Gemini 3.8 Flash Client
 * Structured reasoning, perception, goal parsing, and action selection.
 */
import { GoogleGenAI, Type } from "@google/genai";
import { DOMElementCandidate } from "./browser";
import { StructuredGoal } from "../src/types";
import { parseGoal, parseGoalDeterministically } from "./goalParser";
import { generateSearchQueryForState } from "./queryGenerator";

let geminiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export interface ActionDecisionResponse {
  action_type: "click" | "type" | "scroll" | "back" | "wait";
  target: string;
  selector?: string;
  input_text?: string;
  observed: string;
  reasoning: string;
  goal_reached: boolean;
  goal_evidence?: string;
  current_subgoal?: string;
  candidates: Array<{
    target_semantic: string;
    action_type: string;
    goal_relevance: number;
    novelty: number;
    estimated_success: number;
    unexplored_coverage: number;
  }>;
}

/**
 * Entry point for Goal Parsing.
 * Uses Gemini structured generation (Tier 1) with deterministic fallback (Tier 2).
 */
export async function parseGoalWithGemini(
  rawGoal: string,
  entryUrl: string,
  maxSteps: number = 10,
  maxPaths: number = 3
): Promise<StructuredGoal> {
  return parseGoal(rawGoal, entryUrl, maxSteps, maxPaths);
}

export async function selectNextActionWithGemini(params: {
  structuredGoal: StructuredGoal;
  current_url: string;
  page_title: string;
  elements: DOMElementCandidate[];
  step_number: number;
  history: string[];
  current_subgoal?: string;
}): Promise<ActionDecisionResponse> {
  const { structuredGoal, current_url, page_title, elements, step_number, history, current_subgoal } = params;
  const ai = getGemini();

  // Prepare a concise summary of visible interactive elements
  const elementsSummary = elements.slice(0, 25).map((el, i) => 
    `[${i+1}] ${el.tag.toUpperCase()} selector="${el.selector}" text="${el.text || el.accessibleName}" role="${el.role || ''}" bbox=(${el.bbox.x},${el.bbox.y})`
  ).join("\n");

  if (!ai) {
    return fallbackHeuristicAction(structuredGoal, current_url, page_title, elements, step_number, history, current_subgoal);
  }

  try {
    const prompt = `Current URL: ${current_url}
Page Title: ${page_title}
Step Number: ${step_number}

STRUCTURED GOAL OBJECTIVE:
- Raw Goal: "${structuredGoal.raw_goal}"
- Intent: ${structuredGoal.intent}
- Target Entity/Category: ${structuredGoal.category}
- Attributes: ${JSON.stringify(structuredGoal.attributes)}
- Constraints: ${JSON.stringify(structuredGoal.constraints)}
- Success Conditions: ${JSON.stringify(structuredGoal.success_conditions)}
- Pre-Derived Semantic Search Query: "${structuredGoal.semantic_search_query}"
- Current Subgoal: "${current_subgoal || structuredGoal.current_subgoal || 'Explore interface'}"

Recent Action History:
${JSON.stringify(history.slice(-3))}

Detected Interactive Page Elements:
${elementsSummary || "(No prominent interactive elements detected)"}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are SPECTRA's Autonomous Black-Box UI Tester.
Given the current page state, title, visible elements, and STRUCTURED GOAL:
1. Decide the single best next action to make progress toward the user's objective.
2. CRITICAL SEARCH QUERY RULE:
   - When choosing action_type "type" on a search bar or input field, NEVER use conversational filler (e.g. "try", "find", "look for", "I want", "please", "can you", "help me").
   - Use the pre-derived semantic search query (e.g. "${structuredGoal.semantic_search_query}"), appropriately customized for the current website if needed.
3. GOAL EVALUATION RULE:
   - Do NOT mark goal_reached=true simply because a search was performed, a page loaded, or product results are displayed.
   - For product search: goal is reached ONLY when a relevant item matching the required attributes (e.g. color "${structuredGoal.attributes.color || ''}") is visibly located on the page.
   - For product checkout: goal is reached ONLY when checkout/cart state is reached.
   - For page/doc discovery: goal is reached ONLY when the target page is confirmed open.
4. Provide a clear observed note and reasoning.
Action types: "click", "type", "scroll", "back", "wait".
Return strict JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action_type: { type: Type.STRING },
            target: { type: Type.STRING },
            selector: { type: Type.STRING },
            input_text: { type: Type.STRING },
            observed: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            current_subgoal: { type: Type.STRING },
            goal_reached: { type: Type.BOOLEAN },
            goal_evidence: { type: Type.STRING },
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  target_semantic: { type: Type.STRING },
                  action_type: { type: Type.STRING },
                  goal_relevance: { type: Type.NUMBER },
                  novelty: { type: Type.NUMBER },
                  estimated_success: { type: Type.NUMBER },
                  unexplored_coverage: { type: Type.NUMBER }
                },
                required: ["target_semantic", "action_type", "goal_relevance", "novelty", "estimated_success", "unexplored_coverage"]
              }
            }
          },
          required: ["action_type", "target", "observed", "reasoning", "goal_reached"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    const validActionTypes = ["click", "type", "scroll", "back", "wait"];
    const action_type = validActionTypes.includes(parsed.action_type) ? parsed.action_type : "click";

    // Double-check input_text to ensure no conversational filler slipped through
    let inputText = parsed.input_text;
    if (action_type === "type") {
      const generated = generateSearchQueryForState({
        structuredGoal,
        currentUrl: current_url,
        pageTitle: page_title
      });
      // If the model returned conversational filler in input_text, replace with generated semantic query
      if (!inputText || /\b(try|find|look|want|please|help|can you)\b/i.test(inputText)) {
        inputText = generated.query;
      }
    }

    return {
      action_type: action_type as any,
      target: parsed.target || "Interactive element",
      selector: parsed.selector,
      input_text: inputText,
      observed: parsed.observed || `Viewing ${page_title}`,
      reasoning: parsed.reasoning || `Exploring page matching "${structuredGoal.raw_goal}"`,
      current_subgoal: parsed.current_subgoal || current_subgoal || structuredGoal.current_subgoal,
      goal_reached: Boolean(parsed.goal_reached),
      goal_evidence: parsed.goal_evidence,
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : []
    };
  } catch (err) {
    console.warn("Gemini action selector failed, using heuristic fallback:", err);
    return fallbackHeuristicAction(structuredGoal, current_url, page_title, elements, step_number, history, current_subgoal);
  }
}

function fallbackHeuristicAction(
  structuredGoal: StructuredGoal,
  url: string,
  title: string,
  elements: DOMElementCandidate[],
  step: number,
  history: string[],
  currentSubgoal?: string
): ActionDecisionResponse {
  const queryInfo = generateSearchQueryForState({
    structuredGoal,
    currentUrl: url,
    pageTitle: title
  });

  const targetKeywords = structuredGoal.target_keywords || [];

  // Goal completion requires actual evidence according to intent
  let goalReached = false;
  let goalEvidence = "";

  if (step > 2) {
    const combinedText = `${title} ${url}`.toLowerCase();
    if (structuredGoal.intent === "product_search") {
      // Must find relevant product entity and attribute
      const hasEntity = structuredGoal.category ? combinedText.includes(structuredGoal.category.toLowerCase()) : false;
      const hasColor = structuredGoal.attributes.color ? combinedText.includes(structuredGoal.attributes.color.toLowerCase()) : true;
      if (hasEntity && hasColor) {
        goalReached = true;
        goalEvidence = `Observed matching ${structuredGoal.attributes.color || ''} ${structuredGoal.category} results on page.`;
      }
    } else if (structuredGoal.intent === "documentation_discovery" && (combinedText.includes("doc") || combinedText.includes("guide"))) {
      goalReached = true;
      goalEvidence = "Navigated to documentation section.";
    } else if (structuredGoal.intent === "page_discovery" && combinedText.includes("contact")) {
      goalReached = true;
      goalEvidence = "Navigated to contact page.";
    }
  }

  // 1. Check for search input element on early steps
  const searchInput = elements.find(el => 
    el.tag === "input" && (
      el.role === "searchbox" || 
      el.accessibleName?.toLowerCase().includes("search") || 
      el.selector.toLowerCase().includes("search") ||
      el.selector.toLowerCase().includes("twotabsearchtextbox")
    )
  );

  const hasTypedAlready = history.some(h => h.toLowerCase().includes("type on search") || h.toLowerCase().includes("search for"));

  if (searchInput && !hasTypedAlready) {
    return {
      action_type: "type",
      target: `Search input (${searchInput.accessibleName || searchInput.selector})`,
      selector: searchInput.selector,
      input_text: queryInfo.query,
      observed: `Search input field available on ${title || 'page'}`,
      reasoning: `Entering semantic query "${queryInfo.query}" capturing core requirements without conversational filler.`,
      current_subgoal: `Search catalog for "${queryInfo.query}"`,
      goal_reached: false,
      candidates: [
        { target_semantic: `Search: ${queryInfo.query}`, action_type: "type", goal_relevance: 0.95, novelty: 0.9, estimated_success: 0.9, unexplored_coverage: 0.85 }
      ]
    };
  }

  // 2. Look for an interactive element matching key attributes (color, category, etc.)
  let bestEl: DOMElementCandidate | null = null;
  let bestScore = -1;

  for (const el of elements) {
    const combined = `${el.text} ${el.accessibleName || ''}`.toLowerCase();
    let score = 0;
    for (const w of targetKeywords) {
      if (combined.includes(w)) score += 3;
    }
    // Boost search submit button if we just typed
    if (hasTypedAlready && (el.accessibleName?.toLowerCase().includes("go") || el.accessibleName?.toLowerCase().includes("search") || el.text?.toLowerCase().includes("search"))) {
      score += 4;
    }
    if (score > bestScore) {
      bestScore = score;
      bestEl = el;
    }
  }

  if (bestEl && bestScore > 0) {
    return {
      action_type: "click",
      target: bestEl.text || bestEl.accessibleName || bestEl.selector,
      selector: bestEl.selector,
      observed: `Visible interactive element "${bestEl.text || bestEl.accessibleName}" relevant to ${structuredGoal.category}`,
      reasoning: `Navigating towards "${bestEl.text || bestEl.accessibleName}" to advance goal requirements.`,
      current_subgoal: `Inspect item details for ${structuredGoal.category}`,
      goal_reached: goalReached,
      goal_evidence: goalEvidence,
      candidates: [
        { target_semantic: bestEl.text || bestEl.selector, action_type: "click", goal_relevance: 0.85, novelty: 0.8, estimated_success: 0.8, unexplored_coverage: 0.7 }
      ]
    };
  }

  // 3. Fallback to scroll
  return {
    action_type: "scroll",
    target: "Page content",
    observed: `Current view "${title}" with ${elements.length} interactive elements`,
    reasoning: `Scrolling to uncover additional catalog items and navigation controls.`,
    current_subgoal: `Discover elements matching ${structuredGoal.category}`,
    goal_reached: goalReached,
    goal_evidence: goalEvidence,
    candidates: [
      { target_semantic: "Scroll page", action_type: "scroll", goal_relevance: 0.5, novelty: 0.6, estimated_success: 0.7, unexplored_coverage: 0.9 }
    ]
  };
}

export async function auditUXStepWithGemini(
  stepNumber: number,
  url: string,
  viewSummary: string,
  actionTaken: string,
  reasoning: string
) {
  const ai = getGemini();
  if (!ai) return [];

  try {
    const prompt = `Step: ${stepNumber}\nURL: ${url}\nView: ${viewSummary}\nAction: ${actionTaken}\nReasoning: ${reasoning}`;
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are SPECTRA's Black-Box UX Auditor. Identify visual hierarchy flaws, misleading affordances, high cognitive load, or discoverability barriers on the audited page. Every finding must be categorized explicitly as "AI_INFERRED" or "OBSERVED". Return strict JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  confidence: { type: Type.NUMBER }
                },
                required: ["id", "category", "severity", "title", "description", "recommendation"]
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(res.text?.trim() || "{}");
    return parsed.findings || [];
  } catch (e) {
    return [];
  }
}
