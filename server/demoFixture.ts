/**
 * SPECTRA - Isolated Demo Target Fixture
 * Contains the deterministic ApexAthletics simulation steps and assets.
 * Strictly used ONLY when DEMO mode is explicitly requested by the user.
 */
import { StepRecord, UXFinding } from "./orchestrator";
import { StructuredGoal } from "../src/types";

export function getApexAthleticsDemoGoal(): StructuredGoal {
  return {
    raw_goal: "Explore ApexAthletics store and test blue running shoe checkout flow as guest",
    entry_url: "http://localhost:3000/demo-app",
    intent: "product_search_and_checkout",
    category: "running shoe",
    attributes: {
      color: "blue",
      size: "10",
      keywords: ["shoes", "blue", "running", "cart", "checkout", "guest"]
    },
    constraints: {
      max_price: 5000,
      currency: "₹",
      checkout_type: "guest",
      safe_interaction_only: true
    },
    required_actions: [
      "Navigate to athletic shoe catalog",
      "Filter for Blue running shoes under ₹5,000",
      "Add Apex Velocity to shopping bag",
      "Verify guest checkout form without account registration"
    ],
    success_conditions: [
      "Navigate to athletic shoe catalog",
      "Filter for Blue running shoes under ₹5,000",
      "Add Apex Velocity to shopping bag",
      "Verify guest checkout form without account registration"
    ],
    semantic_search_query: "blue running shoe",
    alternative_queries: ["blue running shoe under 5000"],
    current_subgoal: "Navigate to catalog and filter for Blue running shoes",
    max_steps: 5,
    max_paths: 3,
    exploration_enabled: true,
    target_keywords: ["shoes", "blue", "running", "cart", "checkout", "guest"]
  };
}

export function getApexAthleticsDemoSteps(): Array<{
  title: string;
  url: string;
  view_summary: string;
  action_type: string;
  target: string;
  observed: string;
  reasoning: string;
  latency_ms: number;
  cursor_pos: { x: number; y: number };
  screenshot_svg: string;
  candidates: any[];
  findings: UXFinding[];
}> {
  const baseUrl = "http://localhost:3000/demo-app";

  return [
    {
      title: "Store Catalog Landing",
      url: `${baseUrl}`,
      view_summary: "ApexAthletics catalog homepage with navigation header and product cards.",
      action_type: "click",
      target: "Filter: 'Blue Only'",
      observed: "Color facet sidebar visible on the left; 'Blue Only' filter option present.",
      reasoning: "User goal requires locating blue running shoes; applying color filter narrows candidate list.",
      latency_ms: 320,
      cursor_pos: { x: 130, y: 160 },
      screenshot_svg: `<svg viewBox="0 0 800 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="500" fill="#090d16"/>
        <rect width="800" height="50" fill="#111827" stroke="#1f2937"/>
        <text x="30" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="800" font-size="15">APEX ATHLETICS [DEMO]</text>
        <rect x="680" y="10" width="90" height="30" rx="6" fill="#2563eb"/>
        <text x="702" y="30" fill="white" font-size="12" font-weight="600">Cart (0)</text>
        <rect x="20" y="70" width="180" height="400" rx="8" fill="#111827" stroke="#1f2937"/>
        <text x="36" y="100" fill="#9ca3af" font-size="11" font-weight="700">COLOR</text>
        <rect x="36" y="115" width="148" height="28" rx="4" fill="transparent" stroke="#374151"/>
        <text x="46" y="133" fill="#f3f4f6" font-size="11">All Colors</text>
        <rect x="36" y="150" width="148" height="28" rx="4" fill="#2563eb" stroke="#38bdf8" stroke-width="2"/>
        <text x="46" y="168" fill="white" font-weight="700" font-size="11">Blue Only ✓</text>
        <rect x="220" y="70" width="170" height="220" rx="8" fill="#1e293b" stroke="#334155"/>
        <text x="280" y="135" font-size="34">👟</text>
        <text x="235" y="205" fill="#f8fafc" font-size="12" font-weight="600">Apex Velocity (Blue)</text>
        <text x="235" y="225" fill="#38bdf8" font-size="13" font-weight="700">₹4,499</text>
        <rect x="235" y="245" width="140" height="30" rx="4" fill="#2563eb"/>
        <text x="265" y="265" fill="white" font-size="11" font-weight="600">Add to Bag</text>
      </svg>`,
      candidates: [
        { path_id: 1, target_semantic: "Filter: Blue Only", action_type: "click", goal_relevance: 0.98, novelty: 0.90, estimated_success: 0.92, unexplored_coverage: 0.85, priority: 0.92 },
        { path_id: 2, target_semantic: "Product: Apex Velocity", action_type: "click", goal_relevance: 0.70, novelty: 0.75, estimated_success: 0.65, unexplored_coverage: 0.50, priority: 0.66 }
      ],
      findings: [
        {
          id: "DEMO-A11Y-01",
          category: "DETERMINISTIC",
          severity: "MEDIUM",
          title: "WCAG 2.1 SC 4.1.2: Icon filter control missing accessible name",
          description: "Clear button renders without text or aria-label attribute.",
          recommendation: "Inject aria-label='Clear filters' for screen reader accessibility.",
          step_number: 1,
          url: baseUrl,
          dom_selector: "button.filter-clear",
          confidence: 1.0,
          wcag_rule: "WCAG 4.1.2 Name, Role, Value"
        }
      ]
    },
    {
      title: "Filtered Shoe Results",
      url: `${baseUrl}?color=blue`,
      view_summary: "Catalog displaying blue shoes under ₹5000.",
      action_type: "click",
      target: "Button: 'Add to Bag' for Apex Velocity (₹4,499)",
      observed: "Apex Velocity (Blue, ₹4,499) satisfies both color and price threshold.",
      reasoning: "Adding qualifying product to cart satisfies requirement before proceeding to checkout.",
      latency_ms: 280,
      cursor_pos: { x: 305, y: 260 },
      screenshot_svg: `<svg viewBox="0 0 800 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="500" fill="#090d16"/>
        <rect width="800" height="50" fill="#111827" stroke="#1f2937"/>
        <text x="30" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="800" font-size="15">APEX ATHLETICS [DEMO]</text>
        <rect x="680" y="10" width="90" height="30" rx="6" fill="#16a34a"/>
        <text x="702" y="30" fill="white" font-size="12" font-weight="600">Cart (1)</text>
        <rect x="220" y="70" width="170" height="220" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <text x="280" y="135" font-size="34">👟</text>
        <text x="235" y="205" fill="#f8fafc" font-size="12" font-weight="600">Apex Velocity (Blue)</text>
        <text x="235" y="225" fill="#38bdf8" font-size="13" font-weight="700">₹4,499</text>
        <rect x="235" y="245" width="140" height="30" rx="4" fill="#16a34a"/>
        <text x="260" y="265" fill="white" font-size="11" font-weight="600">✓ In Bag</text>
      </svg>`,
      candidates: [
        { path_id: 1, target_semantic: "Button: Add to Bag", action_type: "click", goal_relevance: 0.95, novelty: 0.85, estimated_success: 0.90, unexplored_coverage: 0.80, priority: 0.88 }
      ],
      findings: []
    },
    {
      title: "Cart & Bag Review",
      url: `${baseUrl}/cart`,
      view_summary: "Shopping bag review view with order total and checkout action.",
      action_type: "click",
      target: "Button: 'Continue as Guest'",
      observed: "Checkout gate displays option to sign in or continue as guest.",
      reasoning: "Goal explicitly requests guest checkout without registration; guest option avoids friction.",
      latency_ms: 350,
      cursor_pos: { x: 420, y: 320 },
      screenshot_svg: `<svg viewBox="0 0 800 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="500" fill="#090d16"/>
        <rect width="800" height="50" fill="#111827" stroke="#1f2937"/>
        <text x="30" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="800" font-size="15">APEX ATHLETICS [DEMO]</text>
        <rect x="200" y="100" width="400" height="280" rx="10" fill="#111827" stroke="#1f2937"/>
        <text x="230" y="140" fill="#f3f4f6" font-size="16" font-weight="700">Shopping Cart (1 item)</text>
        <text x="230" y="175" fill="#9ca3af" font-size="13">Subtotal: ₹4,499</text>
        <rect x="230" y="220" width="340" height="40" rx="6" fill="#2563eb"/>
        <text x="340" y="245" fill="white" font-size="13" font-weight="600">Checkout</text>
        <rect x="230" y="275" width="340" height="40" rx="6" fill="#1f2937" stroke="#374151"/>
        <text x="320" y="300" fill="#9ca3af" font-size="13" font-weight="500">Continue as Guest</text>
      </svg>`,
      candidates: [
        { path_id: 1, target_semantic: "Continue as Guest", action_type: "click", goal_relevance: 0.99, novelty: 0.90, estimated_success: 0.95, unexplored_coverage: 0.85, priority: 0.93 }
      ],
      findings: [
        {
          id: "DEMO-UX-01",
          category: "OBSERVED",
          severity: "LOW",
          title: "Low contrast on secondary guest checkout CTA",
          description: "Guest checkout option blends into background with muted gray text on dark gray container.",
          recommendation: "Increase text contrast ratio to at least 4.5:1 for clear secondary action visibility.",
          step_number: 3,
          url: `${baseUrl}/cart`,
          dom_selector: "button.guest-checkout",
          confidence: 0.9
        }
      ]
    },
    {
      title: "Guest Checkout Verified",
      url: `${baseUrl}/checkout?mode=guest`,
      view_summary: "Guest checkout screen reached successfully with order summary.",
      action_type: "wait",
      target: "Goal Reached Confirmation",
      observed: "Guest checkout view reached with Apex Velocity (₹4,499) in order summary.",
      reasoning: "All success criteria for test goal satisfied successfully.",
      latency_ms: 180,
      cursor_pos: { x: 400, y: 250 },
      screenshot_svg: `<svg viewBox="0 0 800 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="500" fill="#090d16"/>
        <rect width="800" height="50" fill="#111827" stroke="#1f2937"/>
        <text x="30" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-weight="800" font-size="15">APEX ATHLETICS [DEMO]</text>
        <rect x="200" y="100" width="400" height="280" rx="10" fill="#111827" stroke="#10b981"/>
        <text x="310" y="180" font-size="40">✓</text>
        <text x="240" y="230" fill="#10b981" font-size="16" font-weight="700">Guest Checkout Verified</text>
        <text x="240" y="260" fill="#9ca3af" font-size="12">Target item: Apex Velocity (Blue) - ₹4,499</text>
        <text x="240" y="285" fill="#6b7280" font-size="11">Goal successfully achieved without account creation</text>
      </svg>`,
      candidates: [],
      findings: []
    }
  ];
}
