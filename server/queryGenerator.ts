/**
 * SPECTRA - Search Query Generator
 * Derives website-appropriate and state-appropriate search queries from StructuredGoal
 * without raw conversational filler leaking into the browser search box.
 */

import { StructuredGoal } from "../src/types";
import { CONVERSATIONAL_FILLERS } from "./goalParser";

export interface GeneratedQuery {
  query: string;
  rationale: string;
}

export function generateSearchQueryForState(params: {
  structuredGoal: StructuredGoal;
  currentUrl: string;
  pageTitle: string;
  inputNameOrRole?: string;
}): GeneratedQuery {
  const { structuredGoal, currentUrl, pageTitle } = params;

  let baseQuery = structuredGoal.semantic_search_query;

  // If baseQuery is somehow empty, construct from category and attributes
  if (!baseQuery || baseQuery.trim().length === 0) {
    const parts: string[] = [];
    if (structuredGoal.attributes.color) parts.push(structuredGoal.attributes.color);
    if (structuredGoal.category) parts.push(structuredGoal.category);
    baseQuery = parts.join(" ") || "search";
  }

  // Double-check to remove any remaining conversational filler
  let cleanQuery = baseQuery.toLowerCase();
  for (const filler of CONVERSATIONAL_FILLERS) {
    const reg = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
    cleanQuery = cleanQuery.replace(reg, " ");
  }

  // Remove "in size" or "under [price]" from the initial search bar input
  cleanQuery = cleanQuery
    .replace(/\b(?:in\s+size|size)\b/gi, "")
    .replace(/\b(?:under|below)\s*[0-9₹$,]+\b/gi, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If after stripping it's empty, fallback to the structured category
  if (!cleanQuery) {
    cleanQuery = structuredGoal.category || "search";
  }

  // Formulate clear, professional rationale
  let rationale = `Generated semantic search query "${cleanQuery}" `;
  if (structuredGoal.intent === "product_search" || structuredGoal.intent === "product_search_and_checkout") {
    rationale += `capturing the core product entity ("${structuredGoal.category}") and primary attribute from user goal.`;
  } else if (structuredGoal.intent === "documentation_discovery") {
    rationale += `targeting official documentation for "${structuredGoal.category}".`;
  } else if (structuredGoal.intent === "page_discovery") {
    rationale += `targeting the "${structuredGoal.category}" page navigation.`;
  } else {
    rationale += `for autonomous exploration.`;
  }

  return {
    query: cleanQuery,
    rationale
  };
}
