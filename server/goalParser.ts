/**
 * SPECTRA - Semantic Goal Parser & Task Structuring Engine
 * Converts natural-language user goals into structured objectives,
 * extracts attributes (color, size, price, category), eliminates conversational filler,
 * and derives meaningful website search queries without raw-text leakage.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { StructuredGoal, GoalIntent } from "../src/types";

// Conversational filler phrases that should NEVER be part of website search queries
export const CONVERSATIONAL_FILLERS = [
  "try to find",
  "try to look for",
  "try to search",
  "try finding",
  "try searching",
  "try find",
  "try to get",
  "try get",
  "try",
  "find where i can",
  "find how to",
  "find the",
  "find a",
  "find an",
  "find",
  "look for a",
  "look for an",
  "look for the",
  "look for",
  "looking for",
  "search for a",
  "search for an",
  "search for the",
  "search for",
  "i want to find",
  "i want to buy",
  "i want to see",
  "i want a",
  "i want",
  "please help me find",
  "please show me",
  "please find",
  "please search",
  "please",
  "can you find",
  "can you show",
  "can you search",
  "can you",
  "help me find",
  "help me get",
  "help me",
  "show me where to",
  "show me the",
  "show me a",
  "show me",
  "locate the",
  "locate a",
  "locate",
  "navigate to the",
  "navigate to",
  "go to the",
  "go to",
  "where can i find",
  "where to find",
  "where is the",
  "where is",
  "how to find",
  "check if there is",
  "check if",
  "see if there is",
  "see if",
  "get me a",
  "get me",
  "get a",
  "buy a",
  "buy",
  "purchase a",
  "purchase"
];

/**
 * Deterministic Semantic Parser
 * Used as a zero-dependency fallback and unit-testable baseline.
 */
export function parseGoalDeterministically(
  rawGoal: string,
  entryUrl: string,
  maxSteps: number = 10,
  maxPaths: number = 3
): StructuredGoal {
  const goalTrimmed = rawGoal.trim();
  const lower = goalTrimmed.toLowerCase();

  // 1. Detect Intent
  let intent: GoalIntent = "general_exploration";
  if (/\b(checkout|buy|cart|order|purchase)\b/i.test(lower)) {
    intent = "product_search_and_checkout";
  } else if (/\b(docs|documentation|guide|manual|reference|api)\b/i.test(lower)) {
    intent = "documentation_discovery";
  } else if (/\b(dress|dresses|shoe|shoes|shirt|pant|pants|laptop|phone|camera|watch|product|item|price|shop|catalog|clothing|wear|sneaker|sneakers)\b/i.test(lower)) {
    intent = "product_search";
  } else if (/\b(contact\s+page|contact\s+us|\bcontact\b|about\s+us|careers?|privacy|terms|faq|help\s+center|help\s+page|support\s+page)\b/i.test(lower)) {
    intent = "page_discovery";
  } else if (/\b(download|install|installer|setup|release|version)\b/i.test(lower)) {
    intent = "download_discovery";
  } else if (/\b(search|find|lookup)\b/i.test(lower)) {
    intent = "information_retrieval";
  }

  // 2. Extract Color
  let color: string | undefined;
  const colorMatch = lower.match(/\b(yellow|blue|red|green|black|white|pink|purple|orange|grey|gray|brown|navy|beige|teal|maroon|gold|silver)\b/i);
  if (colorMatch) {
    color = colorMatch[1].toLowerCase();
  }

  // 3. Extract Size
  let size: string | undefined;
  // Match "size M", "in size M", "size: M", or standalone size tokens like "size M", "size 10", "size xl"
  const sizeMatch = lower.match(/\b(?:size|in\s+size|size\s*:)\s*([a-z0-9]+)\b/i) ||
                    lower.match(/\b(?:size)\s+([xs|s|m|l|xl|xxl]+)\b/i);
  if (sizeMatch && sizeMatch[1].toLowerCase() !== "and" && sizeMatch[1].toLowerCase() !== "under") {
    size = sizeMatch[1].toUpperCase();
  } else {
    // Check for standalone standard clothing sizes if "size" keyword appears
    if (/\bsize\b/i.test(lower)) {
      const standalone = lower.match(/\b(xxl|xl|xs|[smlx])\b/i);
      if (standalone) size = standalone[1].toUpperCase();
    }
  }

  // 4. Extract Price Constraints
  let maxPrice: number | undefined;
  let currency: string | undefined;
  const priceMatch = lower.match(/(?:under|below|less\s+than|<=?|max(?:imum)?\s*(?:price)?)\s*([₹$€£]|inr|rs\.?|usd)?\s*([0-9,]+)/i);
  if (priceMatch) {
    currency = priceMatch[1] ? priceMatch[1].trim() : (lower.includes("₹") || lower.includes("rs") || lower.includes("inr") ? "₹" : "$");
    const num = parseInt(priceMatch[2].replace(/,/g, ""), 10);
    if (!isNaN(num)) maxPrice = num;
  }

  // 5. Extract Checkout Constraints
  let checkoutType: "guest" | "authenticated" | "any" = "any";
  if (/\b(guest\s+checkout|as\s+(?:a\s+)?guest|without\s+login|without\s+account)\b/i.test(lower)) {
    checkoutType = "guest";
  } else if (/\b(login|sign\s*in|account)\b/i.test(lower)) {
    checkoutType = "authenticated";
  }

  // 6. Extract Category / Core Entity
  let category: string = "item";
  if (/\b(dress|dresses)\b/i.test(lower)) {
    category = "dress";
  } else if (/\b(running\s+shoe|running\s+shoes)\b/i.test(lower)) {
    category = "running shoe";
  } else if (/\b(shoe|shoes|sneaker|sneakers|footwear)\b/i.test(lower)) {
    category = "shoes";
  } else if (/\b(python\s+documentation|python\s+docs)\b/i.test(lower)) {
    category = "Python documentation";
  } else if (/\b(documentation|docs|guide)\b/i.test(lower)) {
    category = "documentation";
  } else if (/\b(contact\s+page|contact\s+us|contact)\b/i.test(lower)) {
    category = "contact page";
  } else if (/\b(download|installer)\b/i.test(lower)) {
    category = "download page";
  } else {
    // Strip fillers to identify the entity
    let stripped = lower;
    for (const filler of CONVERSATIONAL_FILLERS) {
      if (stripped.startsWith(filler + " ")) {
        stripped = stripped.slice(filler.length).trim();
      }
    }
    // Remove trailing prepositional phrases (e.g. "in size M", "under ₹3000", "and reach checkout")
    stripped = stripped
      .replace(/\s+(?:under|below|less than|for|at)\s+.*$/i, "")
      .replace(/\s+(?:in\s+size|size)\s+.*$/i, "")
      .replace(/\s+and\s+.*$/i, "")
      .trim();
    if (stripped.length > 0) {
      category = stripped;
    }
  }

  // 7. Derive the Clean Semantic Search Query (WITHOUT conversational filler!)
  let semanticSearchQuery = "";
  if (intent === "product_search" || intent === "product_search_and_checkout") {
    // Combine color/attributes and category
    const parts = [];
    if (color) parts.push(color);
    parts.push(category);
    semanticSearchQuery = parts.join(" ");
  } else if (intent === "documentation_discovery") {
    if (lower.includes("python")) {
      semanticSearchQuery = "Python documentation";
    } else {
      semanticSearchQuery = category || "documentation";
    }
  } else if (intent === "page_discovery") {
    if (lower.includes("contact")) {
      semanticSearchQuery = "contact";
    } else {
      semanticSearchQuery = category;
    }
  } else {
    // Strip all conversational fillers from the beginning
    let clean = lower;
    for (const filler of CONVERSATIONAL_FILLERS) {
      const reg = new RegExp(`^${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, "i");
      clean = clean.replace(reg, "");
    }
    clean = clean
      .replace(/\b(in\s+size\s+[a-z0-9]+|under\s+[0-9₹$,]+|and\s+reach\s+checkout.*)\b/gi, "")
      .trim();
    semanticSearchQuery = clean || category;
  }

  // Clean trailing non-alphanumeric
  semanticSearchQuery = semanticSearchQuery.replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

  // 8. Formulate Success Conditions & Criteria
  const successConditions: string[] = [];
  if (intent === "product_search" || intent === "product_search_and_checkout") {
    if (color && category) {
      successConditions.push(`Relevant ${color} ${category} found in catalog results`);
    } else {
      successConditions.push(`Relevant ${category} found`);
    }
    if (size) {
      successConditions.push(`Size ${size} confirmed available or selectable on product detail page`);
    }
    if (maxPrice) {
      successConditions.push(`Price verified <= ${currency || "₹"}${maxPrice}`);
    }
    if (checkoutType === "guest" || intent === "product_search_and_checkout") {
      successConditions.push("Guest checkout reached without forced login");
    }
  } else if (intent === "documentation_discovery") {
    successConditions.push("Official documentation page located and verified");
  } else if (intent === "page_discovery") {
    successConditions.push(`${category} located and verified`);
  } else if (intent === "download_discovery") {
    successConditions.push("Official download / release page located");
  } else {
    successConditions.push(`Interface state matching "${rawGoal}" reached`);
  }

  // 9. Required Actions
  const requiredActions: string[] = [];
  if (intent === "product_search" || intent === "product_search_and_checkout") {
    requiredActions.push(`Search for "${semanticSearchQuery}"`);
    requiredActions.push("Inspect search results");
    if (size) requiredActions.push(`Filter or select size ${size}`);
    if (checkoutType === "guest" || intent === "product_search_and_checkout") {
      requiredActions.push("Add to cart and proceed to guest checkout");
    }
  } else if (intent === "documentation_discovery") {
    requiredActions.push("Search or navigate to documentation section");
  } else {
    requiredActions.push(`Navigate toward ${category}`);
  }

  // 10. Target Keywords
  const targetKeywords: string[] = Array.from(new Set([
    ...semanticSearchQuery.toLowerCase().split(/\s+/),
    ...(color ? [color] : []),
    ...(size ? [size.toLowerCase()] : []),
    ...(category ? category.toLowerCase().split(/\s+/) : []),
    ...(intent === "documentation_discovery" ? ["docs", "documentation"] : []),
    ...(intent === "page_discovery" ? ["contact"] : [])
  ])).filter(k => k.length > 1);

  return {
    raw_goal: goalTrimmed,
    entry_url: entryUrl,
    intent,
    category,
    attributes: {
      color,
      size,
      keywords: targetKeywords
    },
    constraints: {
      max_price: maxPrice,
      currency,
      checkout_type: checkoutType,
      safe_interaction_only: true
    },
    required_actions: requiredActions,
    success_conditions: successConditions,
    semantic_search_query: semanticSearchQuery,
    alternative_queries: size ? [`${semanticSearchQuery} size ${size}`] : [semanticSearchQuery],
    current_subgoal: requiredActions[0] || `Explore ${category}`,
    max_steps: maxSteps,
    max_paths: maxPaths,
    exploration_enabled: true,
    target_keywords: targetKeywords
  };
}

/**
 * Full Goal Parser with Gemini 3.8 Flash (Tier 1) and Deterministic Fallback (Tier 2).
 */
export async function parseGoal(
  rawGoal: string,
  entryUrl: string,
  maxSteps: number = 10,
  maxPaths: number = 3
): Promise<StructuredGoal> {
  const fallback = parseGoalDeterministically(rawGoal, entryUrl, maxSteps, maxPaths);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const prompt = `User Testing Goal: "${rawGoal}"
Target Website URL: "${entryUrl}"

Parse this goal into structured task requirements.
CRITICAL INSTRUCTION FOR SEARCH QUERY GENERATION:
1. Do NOT use conversational filler such as "try", "find", "look for", "I want", "please", "can you", "help me", "show me", "buy".
2. The semantic_search_query must contain ONLY the core product/entity and essential attributes (e.g. "yellow dress" or "blue running shoe" or "Python documentation" or "contact").
3. Extract attributes (color, size, brand), price constraints, checkout requirements, and concrete verifiable success conditions.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `You are SPECTRA's Semantic Goal Parser engine.
Convert natural language testing goals into structured objectives without conversational filler.
Return strict JSON adhering to the schema.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: "One of: product_search, product_search_and_checkout, documentation_discovery, page_discovery, download_discovery, account_action, information_retrieval, general_exploration"
            },
            category: { type: Type.STRING, description: "Core product or entity, e.g. dress, running shoe, documentation, contact page" },
            attributes: {
              type: Type.OBJECT,
              properties: {
                color: { type: Type.STRING },
                size: { type: Type.STRING },
                brand: { type: Type.STRING }
              }
            },
            constraints: {
              type: Type.OBJECT,
              properties: {
                max_price: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                checkout_type: { type: Type.STRING, description: "guest, authenticated, or any" }
              }
            },
            required_actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            success_conditions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            semantic_search_query: {
              type: Type.STRING,
              description: "Clean website search query WITHOUT conversational filler. E.g. 'yellow dress', NOT 'try find yellow'"
            },
            alternative_queries: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["intent", "category", "success_conditions", "semantic_search_query"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");

    // Clean any accidental leading conversational words that might still slip through
    let cleanQuery = parsed.semantic_search_query || fallback.semantic_search_query;
    for (const filler of CONVERSATIONAL_FILLERS) {
      const reg = new RegExp(`^${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, "i");
      cleanQuery = cleanQuery.replace(reg, "");
    }
    cleanQuery = cleanQuery.trim();

    return {
      raw_goal: rawGoal.trim(),
      entry_url: entryUrl,
      intent: (parsed.intent as GoalIntent) || fallback.intent,
      category: parsed.category || fallback.category,
      attributes: {
        color: parsed.attributes?.color || fallback.attributes.color,
        size: parsed.attributes?.size || fallback.attributes.size,
        brand: parsed.attributes?.brand || fallback.attributes.brand,
        keywords: fallback.target_keywords
      },
      constraints: {
        max_price: parsed.constraints?.max_price ?? fallback.constraints.max_price,
        currency: parsed.constraints?.currency || fallback.constraints.currency,
        checkout_type: (parsed.constraints?.checkout_type as any) || fallback.constraints.checkout_type,
        safe_interaction_only: true
      },
      required_actions: Array.isArray(parsed.required_actions) && parsed.required_actions.length > 0
        ? parsed.required_actions
        : fallback.required_actions,
      success_conditions: Array.isArray(parsed.success_conditions) && parsed.success_conditions.length > 0
        ? parsed.success_conditions
        : fallback.success_conditions,
      semantic_search_query: cleanQuery || fallback.semantic_search_query,
      alternative_queries: Array.isArray(parsed.alternative_queries) && parsed.alternative_queries.length > 0
        ? parsed.alternative_queries
        : fallback.alternative_queries,
      current_subgoal: (parsed.required_actions && parsed.required_actions[0]) || fallback.current_subgoal,
      max_steps: maxSteps,
      max_paths: maxPaths,
      exploration_enabled: true,
      target_keywords: fallback.target_keywords
    };
  } catch (err) {
    console.warn("Gemini goal parser returned error, falling back to deterministic parser:", err);
    return fallback;
  }
}
