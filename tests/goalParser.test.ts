/**
 * SPECTRA - Automated Semantic Goal Parser & Query Generator Test Suite
 * Validates requirements:
 * Test 1: "Find a yellow dress in size M" -> Expected query: "yellow dress"
 * Test 2: "Find a blue running shoe under ₹5000" -> Expected query: "blue running shoe"
 * Test 3: "Find the Python documentation" -> Expected intent: documentation_discovery
 * Test 4: "Find the contact page" -> Expected intent: page_discovery
 * Test 5: "Buy a yellow dress in size M under ₹3000 and use guest checkout" -> category=dress, color=yellow, size=M, max_price=3000, checkout=guest
 * Test 6: Conversational filler prevention (e.g. "try to find a yellow dress in size" -> query="yellow dress", NOT "try find yellow")
 */

import { parseGoalDeterministically, CONVERSATIONAL_FILLERS } from "../server/goalParser";
import { generateSearchQueryForState } from "../server/queryGenerator";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}`, details || "");
    failedCount++;
  }
}

console.log("\n=======================================================");
console.log("   SPECTRA GOAL PARSER & QUERY GENERATOR TEST SUITE   ");
console.log("=======================================================\n");

// Test 1: "Find a yellow dress in size M"
{
  const goal = parseGoalDeterministically("Find a yellow dress in size M", "https://amazon.in");
  const queryInfo = generateSearchQueryForState({
    structuredGoal: goal,
    currentUrl: "https://amazon.in",
    pageTitle: "Amazon.in"
  });

  assert(
    queryInfo.query === "yellow dress",
    "Test 1: 'Find a yellow dress in size M' produces search query 'yellow dress'",
    { query: queryInfo.query, goal }
  );
  assert(
    goal.attributes.color === "yellow",
    "Test 1b: Color attribute extracted as 'yellow'",
    { color: goal.attributes.color }
  );
  assert(
    goal.attributes.size === "M",
    "Test 1c: Size attribute extracted as 'M'",
    { size: goal.attributes.size }
  );
}

// Test 2: "Find a blue running shoe under ₹5000"
{
  const goal = parseGoalDeterministically("Find a blue running shoe under ₹5000", "https://example.com");
  const queryInfo = generateSearchQueryForState({
    structuredGoal: goal,
    currentUrl: "https://example.com",
    pageTitle: "Store"
  });

  assert(
    queryInfo.query === "blue running shoe" || queryInfo.query === "blue shoes",
    "Test 2: 'Find a blue running shoe under ₹5000' produces meaningful query without price constraint",
    { query: queryInfo.query }
  );
  assert(
    goal.attributes.color === "blue",
    "Test 2b: Color attribute extracted as 'blue'",
    { color: goal.attributes.color }
  );
  assert(
    goal.constraints.max_price === 5000,
    "Test 2c: Price constraint extracted as 5000",
    { max_price: goal.constraints.max_price }
  );
}

// Test 3: "Find the Python documentation"
{
  const goal = parseGoalDeterministically("Find the Python documentation", "https://python.org");

  assert(
    goal.intent === "documentation_discovery",
    "Test 3: 'Find the Python documentation' has intent 'documentation_discovery'",
    { intent: goal.intent }
  );
  assert(
    goal.semantic_search_query.toLowerCase().includes("python documentation"),
    "Test 3b: Search query targets 'Python documentation'",
    { query: goal.semantic_search_query }
  );
}

// Test 4: "Find the contact page"
{
  const goal = parseGoalDeterministically("Find the contact page", "https://company.com");

  assert(
    goal.intent === "page_discovery",
    "Test 4: 'Find the contact page' has intent 'page_discovery'",
    { intent: goal.intent }
  );
  assert(
    goal.semantic_search_query.toLowerCase().includes("contact"),
    "Test 4b: Search query targets 'contact'",
    { query: goal.semantic_search_query }
  );
}

// Test 5: "Buy a yellow dress in size M under ₹3000 and use guest checkout"
{
  const goal = parseGoalDeterministically(
    "Buy a yellow dress in size M under ₹3000 and use guest checkout",
    "https://store.com"
  );

  assert(
    goal.category === "dress",
    "Test 5a: Category is 'dress'",
    { category: goal.category }
  );
  assert(
    goal.attributes.color === "yellow",
    "Test 5b: Color is 'yellow'",
    { color: goal.attributes.color }
  );
  assert(
    goal.attributes.size === "M",
    "Test 5c: Size is 'M'",
    { size: goal.attributes.size }
  );
  assert(
    goal.constraints.max_price === 3000,
    "Test 5d: Max price is 3000",
    { max_price: goal.constraints.max_price }
  );
  assert(
    goal.constraints.checkout_type === "guest",
    "Test 5e: Checkout constraint is 'guest'",
    { checkout_type: goal.constraints.checkout_type }
  );
  assert(
    goal.intent === "product_search_and_checkout",
    "Test 5f: Intent is 'product_search_and_checkout'",
    { intent: goal.intent }
  );
}

// Test 6: Conversational filler prevention
{
  const testPhrases = [
    "try to find a yellow dress in size",
    "try find yellow dress",
    "please help me find a yellow dress",
    "i want to find a yellow dress",
    "show me a yellow dress"
  ];

  for (const phrase of testPhrases) {
    const goal = parseGoalDeterministically(phrase, "https://amazon.in");
    const queryInfo = generateSearchQueryForState({
      structuredGoal: goal,
      currentUrl: "https://amazon.in",
      pageTitle: "Amazon.in"
    });

    // Check no filler in query
    let hasFiller = false;
    for (const filler of ["try", "find", "please", "help", "want", "show"]) {
      if (new RegExp(`\\b${filler}\\b`, "i").test(queryInfo.query)) {
        hasFiller = true;
        break;
      }
    }

    assert(
      !hasFiller && queryInfo.query.includes("yellow") && queryInfo.query.includes("dress"),
      `Test 6: "${phrase}" eliminated filler and produced clean query "${queryInfo.query}"`,
      { phrase, query: queryInfo.query }
    );
  }
}

console.log("\n-------------------------------------------------------");
console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("-------------------------------------------------------\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
