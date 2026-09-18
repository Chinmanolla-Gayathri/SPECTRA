export type TerminationReason = 
  | "GOAL_REACHED"
  | "LOOP_DETECTED"
  | "NO_PROGRESS"
  | "DEAD_END"
  | "MAX_STEPS"
  | "TIMEOUT"
  | "BLOCKED"
  | "ACTION_FAILURE_LIMIT"
  | "NO_VIABLE_ACTIONS"
  | "USER_CANCELLED"
  | "AUDIT_ERROR";

export type StateMachineState = 
  | "NORMAL"
  | "SEARCHING"
  | "EVALUATING"
  | "NAVIGATING"
  | "GOAL_REACHED"
  | "RECOVERABLE_ERROR"
  | "DEAD_END"
  | "LOOP_DETECTED"
  | "NO_PROGRESS"
  | "BLOCKED"
  | "MAX_STEPS"
  | "TIMEOUT"
  | "UNEXPECTED_STATE";

export type TaskEffortLevel = "LOW" | "MODERATE" | "HIGH";

export interface TaskEffort {
  level: TaskEffortLevel;
  score: number;
  explanation: string;
  metrics: {
    interactions: number;
    elapsed_time_sec: number;
    backtracks: number;
    repeated_actions: number;
    navigation_transitions: number;
    recovery_actions: number;
    dead_ends: number;
    loops: number;
  };
}

export interface SemanticAction {
  step_number: number;
  action: "navigate" | "click" | "search" | "type" | "scroll" | "back" | "verify";
  target: string;
  value?: string;
  reason?: string;
  observed_state?: string;
  url?: string;
  page_title?: string;
  timestamp?: number;
  screenshot_ref?: string;
}

export interface SuccessfulPath {
  path_id: string;
  audit_id: string;
  target_url: string;
  original_user_goal: string;
  structured_goal: StructuredGoal;
  ordered_semantic_actions: SemanticAction[];
  observed_states: string[];
  timestamps: number[];
  evidence_references: {
    step_number: number;
    screenshot_ref?: string;
    caption: string;
    observed: string;
  }[];
  step_count: number;
  duration_sec: number;
  backtracks: number;
  repeated_actions: number;
  recovery_actions: number;
  dead_ends_encountered: number;
  loop_count: number;
  action_failures: number;
  goal_progress: number;
  success_criteria_evidence: string[];
  task_effort: TaskEffort;
  ranking_score: number;
  is_recommended: boolean;
}

export interface SavedJourney {
  id: string;
  created_at: number;
  target_url: string;
  raw_goal: string;
  structured_goal: StructuredGoal;
  recommended_journey: SuccessfulPath;
  expected_success_criteria: string[];
  baseline_metrics: {
    step_count: number;
    duration_sec: number;
    backtracks: number;
    loops: number;
    effort_level: TaskEffortLevel;
    findings_count: number;
  };
  tags?: string[];
}

export interface JourneyReplayResult {
  replay_id: string;
  journey_id: string;
  target_url: string;
  goal: string;
  status: "SUCCESS" | "FAILED" | "DIVERGED";
  potential_flow_regression: boolean;
  regression_details?: string[];
  steps_completed: number;
  total_planned_steps: number;
  duration_sec: number;
  failed_at_step?: number;
  failed_action?: SemanticAction;
  failure_reason?: string;
  observed_diff?: string;
  baseline_metrics: {
    step_count: number;
    duration_sec: number;
    backtracks: number;
    loops: number;
  };
  current_metrics: {
    step_count: number;
    duration_sec: number;
    backtracks: number;
    loops: number;
  };
  step_history: {
    step_number: number;
    action: SemanticAction;
    status: "MATCHED" | "RESOLVED" | "FAILED";
    url: string;
    observed: string;
    screenshot_data_url?: string;
  }[];
}

export type FindingCategory = "DETERMINISTIC" | "OBSERVED" | "AI_INFERRED";
export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type GoalIntent =
  | "product_search"
  | "product_search_and_checkout"
  | "documentation_discovery"
  | "page_discovery"
  | "download_discovery"
  | "account_action"
  | "information_retrieval"
  | "general_exploration";

export interface StructuredGoal {
  raw_goal: string;
  entry_url: string;
  intent: GoalIntent;
  category?: string;
  attributes: {
    color?: string;
    size?: string;
    brand?: string;
    model?: string;
    keywords?: string[];
    [key: string]: any;
  };
  constraints: {
    max_price?: number;
    min_price?: number;
    currency?: string;
    checkout_type?: "guest" | "authenticated" | "any";
    safe_interaction_only?: boolean;
    [key: string]: any;
  };
  required_actions: string[];
  success_conditions: string[];
  semantic_search_query: string;
  alternative_queries?: string[];
  current_subgoal?: string;
  max_steps: number;
  max_paths: number;
  exploration_enabled: boolean;
  target_keywords: string[];
}

export type ParsedGoal = StructuredGoal;

export interface ExplorationCandidate {
  path_id: number;
  target_semantic: string;
  action_type: string;
  goal_relevance: number;
  novelty: number;
  estimated_success: number;
  unexplored_coverage: number;
  priority: number;
}

export interface UXFinding {
  id: string;
  category: FindingCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  recommendation: string;
  step_number: number;
  url: string;
  dom_selector?: string;
  confidence: number;
  wcag_rule?: string;
}

export interface StepRecord {
  step_number: number;
  timestamp: number;
  url: string;
  page_title?: string;
  state_id: string;
  status: StateMachineState;
  action_type: string;
  semantic_target: string;
  current_subgoal?: string;
  observed?: string;
  reasoning: string;
  latency_ms: number;
  screenshot_svg?: string;
  screenshot_data_url?: string;
  cursor_pos?: { x: number; y: number };
  active_candidates: ExplorationCandidate[];
  findings_in_step: UXFinding[];
}

export interface FrictionMetrics {
  interaction_cost: number;
  temporal_cost: number;
  navigation_cost: number;
  accessibility_cost: number;
  spectra_friction_index: number;
  click_count: number;
  scroll_count: number;
  input_count: number;
  total_duration_sec: number;
  backtrack_count: number;
  dead_end_count: number;
  wcag_violations_count: number;
}

export interface StateGraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    url: string;
    status: StateMachineState;
    step_number: number;
    visit_count: number;
    summary: string;
    screenshot_svg?: string;
    screenshot_url?: string;
    elements_count?: number;
    action_taken?: string;
  };
}

export interface StateGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated?: boolean;
  data?: {
    friction_cost: number;
    action_type: string;
  };
}

export interface AuditRunSummary {
  id: string;
  goal: ParsedGoal;
  is_demo?: boolean;
  status: StateMachineState | "RUNNING" | "READY" | "COMPLETED" | "STOPPED";
  goal_achieved?: boolean;
  termination_reason?: TerminationReason;
  termination_explanation?: string;
  step_count: number;
  duration_sec: number;
  task_effort?: TaskEffort;
  friction_index: number;
  findings_count: number;
  successful_paths_count?: number;
  createdAt: number;
  error_message?: string | null;
}

export interface FullAuditRun {
  id: string;
  goal: ParsedGoal;
  is_demo?: boolean;
  status: StateMachineState | "RUNNING" | "READY" | "COMPLETED" | "STOPPED";
  goal_achieved: boolean;
  termination_reason?: TerminationReason;
  termination_explanation?: string;
  current_step: number;
  duration_sec: number;
  task_effort: TaskEffort;
  friction_metrics: FrictionMetrics;
  successful_paths: SuccessfulPath[];
  recommended_journey: SuccessfulPath | null;
  stats: {
    paths_explored: number;
    successful_paths_count: number;
    dead_ends_count: number;
    loops_count: number;
    blocked_states_count: number;
    action_failures_count: number;
  };
  findings: UXFinding[];
  steps: StepRecord[];
  graph: {
    nodes: StateGraphNode[];
    edges: StateGraphEdge[];
  };
  error_message?: string | null;
}
