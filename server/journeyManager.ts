/**
 * SPECTRA - Journey Manager & Evaluation Engine
 * Handles stopping conditions, task effort classification, deterministic
 * journey ranking, black-box semantic action replay, and regression detection.
 */

import { 
  StructuredGoal, 
  SuccessfulPath, 
  SemanticAction, 
  TaskEffort, 
  TaskEffortLevel, 
  SavedJourney, 
  JourneyReplayResult,
  TerminationReason
} from "../src/types";
import { RealBrowserController } from "./browser";
import fs from "fs";
import path from "path";

export const STOP_CONDITIONS = {
  MAX_STEPS_PER_PATH: 20,
  MAX_AUDIT_SECONDS: 120,
  MAX_NO_PROGRESS_STEPS: 5,
  MAX_SAME_STATE_VISITS: 2,
  MAX_SAME_STATE_ACTION_PAIR: 2,
  MAX_ACTION_FAILURES: 3,
};

/**
 * Computes Task Effort (LOW / MODERATE / HIGH) based strictly on
 * measurable interaction effort, independent of accessibility violations.
 */
export function calculateTaskEffort(params: {
  interactions: number;
  elapsed_time_sec: number;
  backtracks: number;
  repeated_actions: number;
  navigation_transitions: number;
  recovery_actions: number;
  dead_ends: number;
  loops: number;
  goal_reached?: boolean;
}): TaskEffort {
  const {
    interactions,
    elapsed_time_sec,
    backtracks,
    repeated_actions,
    navigation_transitions,
    recovery_actions,
    dead_ends,
    loops,
    goal_reached = true,
  } = params;

  // Measure friction friction points
  let frictionScore = 0;
  frictionScore += interactions * 2.0;
  frictionScore += (elapsed_time_sec / 10) * 1.5;
  frictionScore += backtracks * 12.0;
  frictionScore += repeated_actions * 10.0;
  frictionScore += recovery_actions * 15.0;
  frictionScore += dead_ends * 25.0;
  frictionScore += loops * 30.0;

  let level: TaskEffortLevel = "LOW";
  let explanation = "Direct and straightforward user flow with minimal interaction overhead.";

  // High effort threshold
  if (
    loops > 0 ||
    dead_ends > 0 ||
    backtracks >= 2 ||
    recovery_actions >= 2 ||
    repeated_actions >= 3 ||
    interactions > 12 ||
    frictionScore >= 50
  ) {
    level = "HIGH";
    if (loops > 0) {
      explanation = `High effort: User flow encountered repetitive cyclic loops (${loops}) requiring backtracking.`;
    } else if (dead_ends > 0) {
      explanation = `High effort: Journey encountered navigation dead-ends (${dead_ends}) and required recovery.`;
    } else if (backtracks >= 2) {
      explanation = `High effort: Multiple backtracks (${backtracks}) were required to locate the goal.`;
    } else {
      explanation = `High effort: Required high interaction volume (${interactions} actions, ${Math.round(elapsed_time_sec)}s) to complete.`;
    }
  } else if (
    backtracks === 1 ||
    repeated_actions >= 1 ||
    recovery_actions === 1 ||
    interactions >= 6 ||
    elapsed_time_sec >= 35 ||
    frictionScore >= 20
  ) {
    level = "MODERATE";
    explanation = `Moderate effort: Required ${interactions} interactions across ${Math.round(elapsed_time_sec)}s with minor navigation adjustments.`;
  } else {
    level = "LOW";
    explanation = `Low effort: Clean direct path completed in ${interactions} interactions (${Math.round(elapsed_time_sec)}s) with 0 loops and 0 backtracks.`;
  }

  return {
    level,
    score: Math.min(100, Math.round(frictionScore)),
    explanation,
    metrics: {
      interactions,
      elapsed_time_sec: Math.round(elapsed_time_sec * 10) / 10,
      backtracks,
      repeated_actions,
      navigation_transitions,
      recovery_actions,
      dead_ends,
      loops,
    },
  };
}

/**
 * Deterministically ranks all successful paths and chooses the RECOMMENDED JOURNEY.
 * Does NOT simply choose the shortest path.
 */
export function rankSuccessfulPaths(paths: SuccessfulPath[]): {
  ranked: SuccessfulPath[];
  recommended: SuccessfulPath | null;
} {
  if (!paths || paths.length === 0) {
    return { ranked: [], recommended: null };
  }

  const scoredPaths = paths.map((path) => {
    let score = 100;

    // Prefer paths with fewer unnecessary interactions
    score -= Math.max(0, path.step_count - 3) * 3;

    // Heavy penalty for backtracks, repeated actions, and dead ends
    score -= path.backtracks * 12;
    score -= path.repeated_actions * 10;
    score -= path.recovery_actions * 15;
    score -= path.dead_ends_encountered * 25;
    score -= path.loop_count * 30;
    score -= path.action_failures * 15;

    // Moderate penalty for time overhead
    score -= Math.floor(path.duration_sec / 15) * 3;

    // Bonus for strong verified success criteria
    const evidenceCount = path.success_criteria_evidence?.length || 1;
    score += Math.min(25, evidenceCount * 5);

    const rankingScore = Math.max(0, Math.round(score));
    return {
      ...path,
      ranking_score: rankingScore,
    };
  });

  // Deterministic sort:
  // 1. Ranking score descending
  // 2. Step count ascending
  // 3. Duration ascending
  // 4. Backtracks ascending
  // 5. Path ID
  scoredPaths.sort((a, b) => {
    if (b.ranking_score !== a.ranking_score) {
      return b.ranking_score - a.ranking_score;
    }
    if (a.step_count !== b.step_count) {
      return a.step_count - b.step_count;
    }
    if (a.duration_sec !== b.duration_sec) {
      return a.duration_sec - b.duration_sec;
    }
    if (a.backtracks !== b.backtracks) {
      return a.backtracks - b.backtracks;
    }
    return a.path_id.localeCompare(b.path_id);
  });

  // Mark top as recommended
  const ranked = scoredPaths.map((p, idx) => ({
    ...p,
    is_recommended: idx === 0,
  }));

  return {
    ranked,
    recommended: ranked[0] || null,
  };
}

/**
 * In-memory repository for saved regression journeys
 */
class JourneyStorage {
  private journeys: Map<string, SavedJourney> = new Map();
  private filePath: string = path.join(process.cwd(), "data", "saved_journeys.json");

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            this.journeys.set(item.id, item);
          }
        }
      }
    } catch (e) {
      // ignore init failure
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(Array.from(this.journeys.values()), null, 2),
        "utf-8"
      );
    } catch (e) {
      // ignore write error
    }
  }

  public save(journey: SavedJourney): SavedJourney {
    this.journeys.set(journey.id, journey);
    this.saveToDisk();
    return journey;
  }

  public get(id: string): SavedJourney | undefined {
    return this.journeys.get(id);
  }

  public list(): SavedJourney[] {
    return Array.from(this.journeys.values()).sort((a, b) => b.created_at - a.created_at);
  }

  public delete(id: string): boolean {
    const deleted = this.journeys.delete(id);
    if (deleted) this.saveToDisk();
    return deleted;
  }
}

export const journeyStorage = new JourneyStorage();

/**
 * Replays a saved journey against the live target website using black-box semantic resolution.
 * If replay fails or diverges, reports exactly where and why.
 */
export async function replaySavedJourney(
  journey: SavedJourney | SuccessfulPath,
  options?: { targetUrlOverride?: string; isSimulated?: boolean }
): Promise<JourneyReplayResult> {
  const replayId = `replay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const startTime = Date.now();

  const recommended = "recommended_journey" in journey ? journey.recommended_journey : journey;
  const targetUrl = options?.targetUrlOverride || recommended.target_url;
  const actions = recommended.ordered_semantic_actions || [];

  const baselineMetrics = {
    step_count: recommended.step_count,
    duration_sec: recommended.duration_sec,
    backtracks: recommended.backtracks,
    loops: recommended.loop_count,
  };

  const stepHistory: JourneyReplayResult["step_history"] = [];
  const regressionDetails: string[] = [];

  // If running in simulated demo mode
  if (options?.isSimulated) {
    await new Promise((r) => setTimeout(r, 600));
    actions.forEach((act, idx) => {
      stepHistory.push({
        step_number: idx + 1,
        action: act,
        status: "RESOLVED",
        url: targetUrl,
        observed: act.observed_state || `Verified semantic action on ${act.target}`,
      });
    });

    return {
      replay_id: replayId,
      journey_id: recommended.path_id,
      target_url: targetUrl,
      goal: recommended.original_user_goal,
      status: "SUCCESS",
      potential_flow_regression: false,
      steps_completed: actions.length,
      total_planned_steps: actions.length,
      duration_sec: Math.round(((Date.now() - startTime) / 1000) * 10) / 10,
      baseline_metrics: baselineMetrics,
      current_metrics: {
        step_count: actions.length,
        duration_sec: 2.5,
        backtracks: 0,
        loops: 0,
      },
      step_history: stepHistory,
    };
  }

  // Real Playwright Replay with Semantic Resolution
  const browser = new RealBrowserController();
  let failedAtStep: number | undefined;
  let failedAction: SemanticAction | undefined;
  let failureReason: string | undefined;
  let observedDiff: string | undefined;

  try {
    const navResult = await browser.navigate(targetUrl);
    let currentUrl = navResult.currentUrl;

    for (let i = 0; i < actions.length; i++) {
      const act = actions[i];
      const stepNumber = i + 1;

      // Extract current visible elements
      const elements = await browser.extractInteractiveElements();
      const currentScreenshot = await browser.captureScreenshot();

      // Resolve semantic target against live DOM
      let matchFound = false;
      let matchedSelector: string | undefined;

      const normTarget = (act.target || "").toLowerCase().trim();
      const normValue = (act.value || "").toLowerCase().trim();

      // 1. Direct or fuzzy match by text/aria
      for (const el of elements) {
        const text = (el.text || "").toLowerCase();
        const aria = (el.accessibleName || "").toLowerCase();

        if (
          (normTarget && (text.includes(normTarget) || aria.includes(normTarget))) ||
          (normValue && (text.includes(normValue) || aria.includes(normValue))) ||
          (act.action === "search" && (el.role === "searchbox" || el.tag === "input"))
        ) {
          matchFound = true;
          matchedSelector = el.selector;
          break;
        }
      }

      // If action is navigate/start
      if (act.action === "navigate") {
        matchFound = true;
      }

      if (!matchFound && act.action !== "scroll" && act.action !== "back" && act.action !== "verify") {
        failedAtStep = stepNumber;
        failedAction = act;
        failureReason = `Semantic target "${act.target}" could not be resolved on the current page (${currentUrl}).`;
        observedDiff = `Expected: "${act.target}" (Action: ${act.action}). Observed ${elements.length} interactive elements but none matched the semantic signature.`;
        
        stepHistory.push({
          step_number: stepNumber,
          action: act,
          status: "FAILED",
          url: currentUrl,
          observed: failureReason,
          screenshot_data_url: currentScreenshot,
        });
        break;
      }

      // Execute semantic action
      if (act.action === "click") {
        const res = await browser.executeAction({
          type: "click",
          target: act.target,
          selector: matchedSelector,
        });
        if (!res.success) {
          failedAtStep = stepNumber;
          failedAction = act;
          failureReason = `Execution failed on semantic target: ${res.error}`;
          break;
        }
      } else if (act.action === "search" || act.action === "type") {
        const res = await browser.executeAction({
          type: "type",
          target: act.target,
          selector: matchedSelector,
          text: act.value || act.target,
        });
        if (!res.success) {
          failedAtStep = stepNumber;
          failedAction = act;
          failureReason = `Input execution failed on semantic target: ${res.error}`;
          break;
        }
      } else if (act.action === "scroll") {
        await browser.executeAction({ type: "scroll", delta_y: 400 });
      } else if (act.action === "back") {
        await browser.executeAction({ type: "back" });
      }

      await new Promise((r) => setTimeout(r, 1000));
      if (browser.page) {
        currentUrl = browser.page.url();
      }

      stepHistory.push({
        step_number: stepNumber,
        action: act,
        status: "RESOLVED",
        url: currentUrl,
        observed: `Semantically resolved "${act.target}" on ${currentUrl}`,
        screenshot_data_url: currentScreenshot,
      });
    }
  } catch (err: any) {
    failureReason = `Browser error during replay: ${err.message}`;
  } finally {
    await browser.close().catch(() => {});
  }

  const durationSec = Math.round(((Date.now() - startTime) / 1000) * 10) / 10;
  const isSuccess = !failedAtStep && stepHistory.length === actions.length;

  let potentialRegression = false;
  if (!isSuccess) {
    potentialRegression = true;
    regressionDetails.push(`Journey failed at step ${failedAtStep}: ${failureReason}`);
  } else if (stepHistory.length > baselineMetrics.step_count + 3) {
    potentialRegression = true;
    regressionDetails.push(`Step count increased significantly from ${baselineMetrics.step_count} to ${stepHistory.length}.`);
  }

  return {
    replay_id: replayId,
    journey_id: recommended.path_id,
    target_url: targetUrl,
    goal: recommended.original_user_goal,
    status: isSuccess ? "SUCCESS" : "FAILED",
    potential_flow_regression: potentialRegression,
    regression_details: regressionDetails.length > 0 ? regressionDetails : undefined,
    steps_completed: stepHistory.filter((s) => s.status === "RESOLVED").length,
    total_planned_steps: actions.length,
    duration_sec: durationSec,
    failed_at_step: failedAtStep,
    failed_action: failedAction,
    failure_reason: failureReason,
    observed_diff: observedDiff,
    baseline_metrics: baselineMetrics,
    current_metrics: {
      step_count: stepHistory.length,
      duration_sec: durationSec,
      backtracks: 0,
      loops: 0,
    },
    step_history: stepHistory,
  };
}
