/**
 * SPECTRA - Autonomous Orchestration Engine
 * Drives Playwright browser navigation, Gemini 3.8 Flash visual perception,
 * deterministic accessibility auditing, and state machine graph generation.
 */

import { selectNextActionWithGemini, auditUXStepWithGemini } from "./gemini";
import { RealBrowserController } from "./browser";
import { getApexAthleticsDemoSteps } from "./demoFixture";
import { 
  StructuredGoal, 
  StateMachineState, 
  TerminationReason, 
  SuccessfulPath, 
  SemanticAction, 
  TaskEffort,
  UXFinding,
  FindingCategory,
  SeverityLevel,
  ExplorationCandidate,
  StepRecord,
  StateGraphNode,
  StateGraphEdge,
  FrictionMetrics
} from "../src/types";
import { STOP_CONDITIONS, calculateTaskEffort, rankSuccessfulPaths } from "./journeyManager";

export type { StateMachineState, UXFinding, ExplorationCandidate, StepRecord, StateGraphNode, StateGraphEdge, FrictionMetrics };

export class ExecutionOrchestrator {
  public runId: string;
  public goal: StructuredGoal;
  public isDemo: boolean = false;
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public currentStep: number = 0;
  public currentState: StateMachineState = "NORMAL";
  public startTime: number = 0;
  public errorMessage: string | null = null;

  // Real Goal & Journey tracking
  public goalAchieved: boolean = false;
  public terminationReason: TerminationReason | null = null;
  public terminationExplanation: string = "";
  public successfulPaths: SuccessfulPath[] = [];
  public recommendedJourney: SuccessfulPath | null = null;
  public taskEffort: TaskEffort | null = null;

  // Interaction telemetry counters
  public clickCount: number = 0;
  public scrollCount: number = 0;
  public inputCount: number = 0;
  public backtrackCount: number = 0;
  public deadEndCount: number = 0;
  public loopCount: number = 0;
  public actionFailuresCount: number = 0;
  public recoveryActionsCount: number = 0;
  public repeatedActionsCount: number = 0;
  public blockedStatesCount: number = 0;
  public noProgressStepsCount: number = 0;

  // State loop & fingerprint tracking
  public stateVisitCounts: Map<string, number> = new Map();
  public stateActionPairCounts: Map<string, number> = new Map();
  public recentSearchQueries: string[] = [];
  private previousDomSignature: string = "";

  public steps: StepRecord[] = [];
  public findings: UXFinding[] = [];
  public nodes: Map<string, StateGraphNode> = new Map();
  public edges: StateGraphEdge[] = [];
  public visitedStateHistory: string[] = [];

  private listeners: ((event: any) => void)[] = [];
  private browser: RealBrowserController | null = null;

  constructor(runId: string, goal: StructuredGoal, isDemo: boolean = false) {
    this.runId = runId;
    this.goal = goal;
    this.isDemo = isDemo;
  }

  public addEventListener(cb: (event: any) => void) {
    this.listeners.push(cb);
  }

  public removeEventListener(cb: (event: any) => void) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }

  private emit(event: any) {
    for (const cb of this.listeners) {
      try {
        cb(event);
      } catch (err) {
        // ignore client disconnected
      }
    }
  }

  public stop() {
    this.isRunning = false;
    this.currentState = "UNEXPECTED_STATE";
    if (this.browser) {
      this.browser.close().catch(() => {});
    }
    this.emit({
      type: "RUN_STOPPED",
      run_id: this.runId,
      step: this.currentStep
    });
  }

  public pause() {
    this.isPaused = true;
    this.emit({ type: "RUN_PAUSED", run_id: this.runId });
  }

  public resume() {
    this.isPaused = false;
    this.emit({ type: "RUN_RESUMED", run_id: this.runId });
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    this.errorMessage = null;

    this.emit({
      type: "RUN_STARTED",
      run_id: this.runId,
      goal: this.goal,
      timestamp: Date.now()
    });

    if (this.isDemo) {
      await this.runDemoSimulation();
    } else {
      await this.runRealBrowserAudit();
    }
  }

  /**
   * Real Autonomous Browser Audit using Playwright + Gemini 3.8 Flash
   */
  private async runRealBrowserAudit() {
    this.browser = new RealBrowserController();

    let currentUrl = this.goal.entry_url;
    let pageTitle = "";

    try {
      this.emit({
        type: "ACTIVITY_LOG",
        message: `Launching headless browser engine...`
      });

      // 1. Initial Navigation
      const navResult = await this.browser.navigate(currentUrl);
      currentUrl = navResult.currentUrl;
      pageTitle = navResult.title;

      this.emit({
        type: "ACTIVITY_LOG",
        message: `Navigated to ${currentUrl} ("${pageTitle}")`
      });
    } catch (err: any) {
      this.isRunning = false;
      this.currentState = "UNEXPECTED_STATE";
      this.errorMessage = `Unable to start browser audit: ${err.message}`;
      
      this.emit({
        type: "RUN_FAILED",
        run_id: this.runId,
        error: this.errorMessage
      });

      await this.browser.close().catch(() => {});
      return;
    }

    const actionHistory: string[] = [];
    const maxSteps = Math.min(this.goal.max_steps || STOP_CONDITIONS.MAX_STEPS_PER_PATH, STOP_CONDITIONS.MAX_STEPS_PER_PATH);

    for (let i = 0; i < maxSteps && this.isRunning; i++) {
      while (this.isPaused && this.isRunning) {
        await new Promise(r => setTimeout(r, 400));
      }
      if (!this.isRunning) break;

      // 1. Duration check
      const elapsedSec = (Date.now() - this.startTime) / 1000;
      if (elapsedSec >= STOP_CONDITIONS.MAX_AUDIT_SECONDS) {
        this.terminationReason = "TIMEOUT";
        this.terminationExplanation = `Audit duration reached maximum timeout limit (${STOP_CONDITIONS.MAX_AUDIT_SECONDS}s).`;
        this.currentState = "TIMEOUT";
        this.emit({
          type: "ACTIVITY_LOG",
          message: `STOP: ${this.terminationExplanation}`
        });
        break;
      }

      this.currentStep = i + 1;
      const stepStart = Date.now();
      const stateId = `state_${this.currentStep}`;

      this.emit({
        type: "ACTIVITY_LOG",
        message: `Analyzing interface state on ${currentUrl}...`
      });

      // 2. Capture real visual state
      const screenshotDataUrl = await this.browser.captureScreenshot();

      // 3. Extract real interactive elements
      const elements = await this.browser.extractInteractiveElements();

      // 4. Run real deterministic accessibility check
      const deterministicFindings = await this.browser.runDeterministicAccessibilityAudit();
      const stepFindings: UXFinding[] = deterministicFindings.map(df => ({
        ...df,
        step_number: this.currentStep,
        url: currentUrl
      }));

      // 5. Blocked / Bot Barrier Detection
      const lowerTitle = (pageTitle || "").toLowerCase();
      const lowerUrl = (currentUrl || "").toLowerCase();
      if (
        lowerTitle.includes("attention required") ||
        lowerTitle.includes("cloudflare") ||
        lowerTitle.includes("captcha") ||
        lowerTitle.includes("robot or human") ||
        lowerTitle.includes("access denied") ||
        lowerTitle.includes("403 forbidden") ||
        lowerUrl.includes("challenge")
      ) {
        this.blockedStatesCount++;
        this.currentState = "BLOCKED";
        this.terminationReason = "BLOCKED";
        this.terminationExplanation = "Automated exploration was halted by an authentication, CAPTCHA, or bot protection barrier.";
        this.emit({
          type: "ACTIVITY_LOG",
          message: `BLOCKED: ${this.terminationExplanation}`
        });
        break;
      }

      // 6. Dead End / No Viable Actions
      if (elements.length === 0 && this.currentStep > 1) {
        this.deadEndCount++;
        this.currentState = "DEAD_END";
        this.terminationReason = "NO_VIABLE_ACTIONS";
        this.terminationExplanation = "No interactive or navigable controls were discovered on this interface view.";
        this.emit({
          type: "ACTIVITY_LOG",
          message: `DEAD END: ${this.terminationExplanation}`
        });
        break;
      }

      // 7. Loop & State Tracking
      const domSignature = elements.slice(0, 10).map(e => `${e.tag}:${e.text.slice(0, 15)}`).join("|");
      const stateSig = `${currentUrl}::${pageTitle}`;
      this.visitedStateHistory.push(stateSig);

      const visitCount = (this.stateVisitCounts.get(stateSig) || 0) + 1;
      this.stateVisitCounts.set(stateSig, visitCount);

      if (domSignature === this.previousDomSignature && this.previousDomSignature !== "") {
        this.noProgressStepsCount++;
      } else {
        this.noProgressStepsCount = 0;
      }
      this.previousDomSignature = domSignature;

      let stateStatus: StateMachineState = "NORMAL";

      // If visited exact state 3+ times or no progress for 5 steps
      if (this.noProgressStepsCount >= STOP_CONDITIONS.MAX_NO_PROGRESS_STEPS) {
        stateStatus = "NO_PROGRESS";
        this.currentState = stateStatus;
        this.terminationReason = "NO_PROGRESS";
        this.terminationExplanation = `Explored ${STOP_CONDITIONS.MAX_NO_PROGRESS_STEPS} consecutive steps without progressing or identifying new interactive states.`;
        this.emit({
          type: "ACTIVITY_LOG",
          message: `STOP: ${this.terminationExplanation}`
        });
        break;
      }

      if (visitCount >= 3) {
        stateStatus = "LOOP_DETECTED";
        this.loopCount++;
        this.currentState = stateStatus;
        this.terminationReason = "LOOP_DETECTED";
        this.terminationExplanation = `State "${pageTitle || currentUrl}" visited repeatedly (${visitCount} times) in a cyclic navigation loop.`;
        this.emit({
          type: "ACTIVITY_LOG",
          message: `LOOP DETECTED: ${this.terminationExplanation}`
        });
        break;
      }

      // 8. Autonomous perception and next action selection with Gemini 3.8 Flash
      const decision = await selectNextActionWithGemini({
        structuredGoal: this.goal,
        current_url: currentUrl,
        page_title: pageTitle,
        elements: elements,
        step_number: this.currentStep,
        history: actionHistory,
        current_subgoal: this.goal.current_subgoal
      });

      if (decision.current_subgoal) {
        this.goal.current_subgoal = decision.current_subgoal;
      }

      // Check state + action pair repetition
      const stateActionPairKey = `${stateSig}::${decision.action_type}::${decision.target}`;
      const actionPairCount = (this.stateActionPairCounts.get(stateActionPairKey) || 0) + 1;
      this.stateActionPairCounts.set(stateActionPairKey, actionPairCount);

      if (actionPairCount >= STOP_CONDITIONS.MAX_SAME_STATE_ACTION_PAIR) {
        this.repeatedActionsCount++;
        this.loopCount++;
        stateStatus = "LOOP_DETECTED";
        this.currentState = stateStatus;
        this.terminationReason = "LOOP_DETECTED";
        this.terminationExplanation = `Repeated action (${decision.action_type} on "${decision.target}") on identical view state detected.`;
        this.emit({
          type: "ACTIVITY_LOG",
          message: `LOOP DETECTED: ${this.terminationExplanation}`
        });
        break;
      }

      actionHistory.push(`${decision.action_type} on ${decision.target}`);

      if (decision.goal_reached) {
        stateStatus = "GOAL_REACHED";
      }
      this.currentState = stateStatus;

      // 9. Audit UX step heuristics
      try {
        const aiUX = await auditUXStepWithGemini(
          this.currentStep,
          currentUrl,
          `Viewing ${pageTitle} with ${elements.length} interactive controls`,
          `${decision.action_type} on ${decision.target}`,
          decision.reasoning
        );
        if (Array.isArray(aiUX)) {
          for (const ux of aiUX) {
            stepFindings.push({
              id: `AI-UX-${this.currentStep}-${Math.random().toString(36).substring(2, 6)}`,
              category: (ux.category as FindingCategory) || "AI_INFERRED",
              severity: (ux.severity as SeverityLevel) || "MEDIUM",
              title: ux.title || "UX friction pattern",
              description: ux.description || "",
              recommendation: ux.recommendation || "",
              step_number: this.currentStep,
              url: currentUrl,
              confidence: ux.confidence || 0.85
            });
          }
        }
      } catch (e) {
        // ignore optional AI findings
      }

      this.findings.push(...stepFindings);

      // Rank exploration candidates using Priority Heuristic
      const rankedCandidates: ExplorationCandidate[] = (decision.candidates || []).map((c, idx) => {
        const priority = (
          0.35 * (c.goal_relevance || 0.5) +
          0.25 * (c.novelty || 0.5) +
          0.20 * (c.estimated_success || 0.5) +
          0.20 * (c.unexplored_coverage || 0.5)
        );
        return {
          path_id: idx + 1,
          target_semantic: c.target_semantic,
          action_type: c.action_type,
          goal_relevance: c.goal_relevance || 0.5,
          novelty: c.novelty || 0.5,
          estimated_success: c.estimated_success || 0.5,
          unexplored_coverage: c.unexplored_coverage || 0.5,
          priority: Math.round(priority * 100) / 100
        };
      }).sort((a, b) => b.priority - a.priority);

      // 10. Record step
      const stepLatency = Date.now() - stepStart;
      const stepRecord: StepRecord = {
        step_number: this.currentStep,
        timestamp: Date.now(),
        url: currentUrl,
        page_title: pageTitle,
        state_id: stateId,
        status: stateStatus,
        action_type: decision.action_type,
        semantic_target: decision.target,
        current_subgoal: decision.current_subgoal || this.goal.current_subgoal,
        observed: decision.observed,
        reasoning: decision.reasoning,
        latency_ms: stepLatency,
        screenshot_data_url: screenshotDataUrl,
        active_candidates: rankedCandidates,
        findings_in_step: stepFindings
      };

      this.steps.push(stepRecord);

      // 11. Update State Graph
      this.updateGraph(stepRecord, pageTitle || currentUrl, decision.observed, elements.length);

      // 12. Stream real-time progress over SSE
      this.emit({
        type: "STEP_PROGRESS",
        run_id: this.runId,
        step: this.currentStep,
        status: this.currentState,
        url: currentUrl,
        page_title: pageTitle,
        state_id: stateId,
        current_subgoal: decision.current_subgoal || this.goal.current_subgoal,
        action: {
          type: decision.action_type,
          target: decision.target,
          observed: decision.observed,
          reasoning: decision.reasoning
        },
        latency_ms: stepLatency,
        screenshot_data_url: screenshotDataUrl,
        candidates: rankedCandidates,
        new_findings: stepFindings,
        graph: this.getGraph()
      });

      // Update action counters
      if (decision.action_type === "click") this.clickCount++;
      if (decision.action_type === "scroll") this.scrollCount++;
      if (decision.action_type === "type") this.inputCount++;
      if (decision.action_type === "back") this.backtrackCount++;

      // 13. Check Goal Reached First-Class State
      if (decision.goal_reached) {
        this.goalAchieved = true;
        this.currentState = "GOAL_REACHED";
        this.terminationReason = "GOAL_REACHED";
        this.terminationExplanation = decision.goal_evidence || "All verifiable success criteria satisfied.";

        // Build ordered semantic actions
        const semanticActions: SemanticAction[] = this.steps.map(s => ({
          step_number: s.step_number,
          action: (s.action_type as any) || "click",
          target: s.semantic_target,
          value: s.action_type === "type" ? decision.input_text || s.semantic_target : undefined,
          reason: s.reasoning,
          observed_state: s.observed,
          url: s.url,
          page_title: s.page_title,
          timestamp: s.timestamp,
          screenshot_ref: s.screenshot_data_url
        }));

        const pathDuration = Math.round(((Date.now() - this.startTime) / 1000) * 10) / 10;
        const pathEffort = calculateTaskEffort({
          interactions: this.clickCount + this.scrollCount + this.inputCount + this.backtrackCount,
          elapsed_time_sec: pathDuration,
          backtracks: this.backtrackCount,
          repeated_actions: this.repeatedActionsCount,
          navigation_transitions: this.steps.length,
          recovery_actions: this.recoveryActionsCount,
          dead_ends: this.deadEndCount,
          loops: this.loopCount,
          goal_reached: true
        });

        const successfulPath: SuccessfulPath = {
          path_id: `path_${this.successfulPaths.length + 1}`,
          audit_id: this.runId,
          target_url: this.goal.entry_url,
          original_user_goal: this.goal.raw_goal,
          structured_goal: this.goal,
          ordered_semantic_actions: semanticActions,
          observed_states: this.steps.map(s => s.observed || ""),
          timestamps: this.steps.map(s => s.timestamp),
          evidence_references: [{
            step_number: this.currentStep,
            screenshot_ref: screenshotDataUrl,
            caption: "Goal verified and success criteria satisfied",
            observed: decision.observed || decision.goal_evidence || "Goal verified"
          }],
          step_count: this.steps.length,
          duration_sec: pathDuration,
          backtracks: this.backtrackCount,
          repeated_actions: this.repeatedActionsCount,
          recovery_actions: this.recoveryActionsCount,
          dead_ends_encountered: this.deadEndCount,
          loop_count: this.loopCount,
          action_failures: this.actionFailuresCount,
          goal_progress: 100,
          success_criteria_evidence: this.goal.success_conditions || [decision.goal_evidence || "Success criteria satisfied"],
          task_effort: pathEffort,
          ranking_score: 100,
          is_recommended: true
        };

        this.successfulPaths.push(successfulPath);
        const { recommended } = rankSuccessfulPaths(this.successfulPaths);
        this.recommendedJourney = recommended;

        this.emit({
          type: "GOAL_REACHED",
          run_id: this.runId,
          step: this.currentStep,
          evidence: decision.goal_evidence,
          path: successfulPath
        });

        this.emit({
          type: "ACTIVITY_LOG",
          message: `Goal verified successfully: ${decision.goal_evidence || "Success criteria satisfied."}`
        });
        break;
      }

      // 14. Actually execute the chosen action in Playwright
      this.emit({
        type: "ACTIVITY_LOG",
        message: `Executing ${decision.action_type} on ${decision.target}...`
      });

      const execResult = await this.browser.executeAction({
        type: decision.action_type,
        target: decision.target,
        selector: decision.selector,
        text: decision.input_text
      });

      if (!execResult.success) {
        this.actionFailuresCount++;
        this.emit({
          type: "ACTIVITY_LOG",
          message: `Action warning: ${execResult.error || "Action execution error"}`
        });

        if (this.actionFailuresCount >= STOP_CONDITIONS.MAX_ACTION_FAILURES) {
          this.currentState = "DEAD_END";
          this.terminationReason = "ACTION_FAILURE_LIMIT";
          this.terminationExplanation = `Exceeded maximum allowable action failures (${STOP_CONDITIONS.MAX_ACTION_FAILURES} failed actions).`;
          break;
        }
      }

      // Update current URL and page title after action
      if (this.browser.page) {
        currentUrl = this.browser.page.url();
        pageTitle = await this.browser.page.title().catch(() => pageTitle);
      }

      // Pacing
      await new Promise(r => setTimeout(r, 1200));
    }

    // If reached max steps without goal
    if (!this.goalAchieved && !this.terminationReason) {
      this.terminationReason = "MAX_STEPS";
      this.terminationExplanation = `Reached step limit (${maxSteps} steps) without verifying final goal criteria.`;
      this.currentState = "MAX_STEPS";
    }

    // Complete run
    await this.browser.close().catch(() => {});
    this.completeRun();
  }

  /**
   * Explicitly Isolated Demo Simulation for ApexAthletics
   */
  private async runDemoSimulation() {
    const demoSteps = getApexAthleticsDemoSteps();

    for (let i = 0; i < demoSteps.length && this.isRunning; i++) {
      while (this.isPaused && this.isRunning) {
        await new Promise(r => setTimeout(r, 400));
      }
      if (!this.isRunning) break;

      this.currentStep = i + 1;
      const planned = demoSteps[i];
      const stateId = `state_demo_${this.currentStep}`;

      let stateStatus: StateMachineState = "NORMAL";
      const isFinal = (i === demoSteps.length - 1);
      if (isFinal) {
        stateStatus = "GOAL_REACHED";
      }
      this.currentState = stateStatus;

      this.clickCount++;
      const stepFindings = planned.findings.map(f => ({ ...f, step_number: this.currentStep }));
      this.findings.push(...stepFindings);

      const stepRecord: StepRecord = {
        step_number: this.currentStep,
        timestamp: Date.now(),
        url: planned.url,
        page_title: planned.title,
        state_id: stateId,
        status: stateStatus,
        action_type: planned.action_type,
        semantic_target: planned.target,
        observed: planned.observed,
        reasoning: planned.reasoning,
        latency_ms: planned.latency_ms,
        screenshot_svg: planned.screenshot_svg,
        cursor_pos: planned.cursor_pos,
        active_candidates: planned.candidates,
        findings_in_step: stepFindings
      };

      this.steps.push(stepRecord);
      this.updateGraph(stepRecord, planned.title, planned.observed, 12);

      this.emit({
        type: "STEP_PROGRESS",
        run_id: this.runId,
        step: this.currentStep,
        status: this.currentState,
        url: planned.url,
        page_title: planned.title,
        state_id: stateId,
        action: {
          type: planned.action_type,
          target: planned.target,
          observed: planned.observed,
          reasoning: planned.reasoning
        },
        latency_ms: planned.latency_ms,
        screenshot_svg: planned.screenshot_svg,
        candidates: planned.candidates,
        new_findings: stepFindings,
        graph: this.getGraph()
      });

      if (isFinal) {
        this.goalAchieved = true;
        this.terminationReason = "GOAL_REACHED";
        this.terminationExplanation = "Verified guest checkout form without account registration.";

        const demoActions: SemanticAction[] = this.steps.map(s => ({
          step_number: s.step_number,
          action: (s.action_type as any) || "click",
          target: s.semantic_target,
          observed_state: s.observed,
          reason: s.reasoning,
          url: s.url,
          page_title: s.page_title,
          timestamp: s.timestamp,
          screenshot_ref: s.screenshot_svg
        }));

        const demoPathEffort = calculateTaskEffort({
          interactions: 4,
          elapsed_time_sec: 5.6,
          backtracks: 0,
          repeated_actions: 0,
          navigation_transitions: 4,
          recovery_actions: 0,
          dead_ends: 0,
          loops: 0,
          goal_reached: true
        });

        const demoPath: SuccessfulPath = {
          path_id: "demo_path_1",
          audit_id: this.runId,
          target_url: this.goal.entry_url,
          original_user_goal: this.goal.raw_goal,
          structured_goal: this.goal,
          ordered_semantic_actions: demoActions,
          observed_states: this.steps.map(s => s.observed || ""),
          timestamps: this.steps.map(s => s.timestamp),
          evidence_references: [{
            step_number: 4,
            screenshot_ref: planned.screenshot_svg,
            caption: "Guest checkout order review form accessible directly",
            observed: planned.observed
          }],
          step_count: 4,
          duration_sec: 5.6,
          backtracks: 0,
          repeated_actions: 0,
          recovery_actions: 0,
          dead_ends_encountered: 0,
          loop_count: 0,
          action_failures: 0,
          goal_progress: 100,
          success_criteria_evidence: [
            "Navigated to athletic shoe catalog",
            "Applied Blue Only filter",
            "Added Apex Velocity to bag",
            "Guest checkout form verified without login requirement"
          ],
          task_effort: demoPathEffort,
          ranking_score: 100,
          is_recommended: true
        };

        this.successfulPaths.push(demoPath);
        this.recommendedJourney = demoPath;

        this.emit({
          type: "GOAL_REACHED",
          run_id: this.runId,
          step: this.currentStep,
          evidence: "Guest checkout flow successfully verified without account login.",
          path: demoPath
        });
      }

      await new Promise(r => setTimeout(r, 1400));
    }

    this.completeRun();
  }

  private completeRun() {
    const totalDuration = (Date.now() - this.startTime) / 1000;
    const frictionMetrics = this.computeFrictionMetrics(totalDuration);

    if (!this.terminationReason) {
      if (this.goalAchieved) {
        this.terminationReason = "GOAL_REACHED";
        this.terminationExplanation = "Target goal criteria verified successfully.";
      } else if (this.loopCount > 0) {
        this.terminationReason = "LOOP_DETECTED";
        this.terminationExplanation = "Navigation loop prevented reaching goal.";
      } else if (this.deadEndCount > 0) {
        this.terminationReason = "DEAD_END";
        this.terminationExplanation = "Reached dead end on target site.";
      } else {
        this.terminationReason = "NO_PROGRESS";
        this.terminationExplanation = "Exploration concluded without reaching target goal.";
      }
    }

    this.taskEffort = calculateTaskEffort({
      interactions: this.clickCount + this.scrollCount + this.inputCount + this.backtrackCount,
      elapsed_time_sec: totalDuration,
      backtracks: this.backtrackCount,
      repeated_actions: this.repeatedActionsCount,
      navigation_transitions: this.steps.length,
      recovery_actions: this.recoveryActionsCount,
      dead_ends: this.deadEndCount,
      loops: this.loopCount,
      goal_reached: this.goalAchieved
    });

    if (this.goalAchieved && this.successfulPaths.length > 0 && !this.recommendedJourney) {
      const { recommended } = rankSuccessfulPaths(this.successfulPaths);
      this.recommendedJourney = recommended;
    }

    const runStats = {
      paths_explored: this.edges.length + 1,
      successful_paths_count: this.successfulPaths.length,
      dead_ends_count: this.deadEndCount,
      loops_count: this.loopCount,
      blocked_states_count: this.blockedStatesCount,
      action_failures_count: this.actionFailuresCount
    };

    this.emit({
      type: "RUN_COMPLETED",
      run_id: this.runId,
      final_status: this.currentState,
      goal_achieved: this.goalAchieved,
      termination_reason: this.terminationReason,
      termination_explanation: this.terminationExplanation,
      total_steps: this.currentStep,
      duration_sec: Math.round(totalDuration * 10) / 10,
      task_effort: this.taskEffort,
      friction_metrics: frictionMetrics,
      successful_paths: this.successfulPaths,
      recommended_journey: this.recommendedJourney,
      stats: runStats,
      findings: this.findings,
      graph: this.getGraph(),
      steps: this.steps
    });

    this.isRunning = false;
  }

  private updateGraph(step: StepRecord, title: string, summary: string, elementsCount: number = 0) {
    const stepIdx = step.step_number;
    const pos_x = 80 + (stepIdx - 1) * 260;
    const pos_y = 120 + ((stepIdx % 2) * 80);

    if (!this.nodes.has(step.state_id)) {
      this.nodes.set(step.state_id, {
        id: step.state_id,
        type: "spectraStateNode",
        position: { x: pos_x, y: pos_y },
        data: {
          label: title,
          url: step.url,
          status: step.status,
          step_number: step.step_number,
          visit_count: 1,
          summary: summary,
          screenshot_url: step.screenshot_data_url,
          screenshot_svg: step.screenshot_svg,
          elements_count: elementsCount,
          action_taken: `${step.action_type}: ${step.semantic_target}`
        }
      });
    }

    // Edge from previous state
    if (this.steps.length > 1) {
      const prev = this.steps[this.steps.length - 2];
      const edgeId = `edge_${prev.state_id}_${step.state_id}`;
      if (!this.edges.some(e => e.id === edgeId)) {
        this.edges.push({
          id: edgeId,
          source: prev.state_id,
          target: step.state_id,
          label: `${step.action_type}: ${step.semantic_target.slice(0, 24)}`,
          animated: true,
          data: {
            friction_cost: Math.round((1.0 + (step.latency_ms / 800)) * 10) / 10,
            action_type: step.action_type
          }
        });
      }
    }
  }

  public getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };
  }

  public computeFrictionMetrics(durationSec: number): FrictionMetrics {
    const interactionCost = Math.round(Math.min(30, (this.clickCount * 1.5 + this.scrollCount * 0.8 + this.inputCount * 2.0) * 1.2) * 10) / 10;
    const temporalCost = Math.round(Math.min(25, (durationSec / 15.0) * 12) * 10) / 10;
    const navigationCost = Math.round(Math.min(25, (this.backtrackCount * 5.0 + this.deadEndCount * 15.0 + this.loopCount * 20.0)) * 10) / 10;

    let a11yScore = 0;
    for (const f of this.findings) {
      if (f.category === "DETERMINISTIC" || f.wcag_rule) {
        if (f.severity === "CRITICAL") a11yScore += 8;
        else if (f.severity === "HIGH") a11yScore += 5;
        else if (f.severity === "MEDIUM") a11yScore += 2.5;
        else a11yScore += 1;
      }
    }
    const accessibilityCost = Math.round(Math.min(20, a11yScore) * 10) / 10;
    const spectraIndex = Math.round(Math.min(100, interactionCost + temporalCost + navigationCost + accessibilityCost) * 10) / 10;

    return {
      interaction_cost: interactionCost,
      temporal_cost: temporalCost,
      navigation_cost: navigationCost,
      accessibility_cost: accessibilityCost,
      spectra_friction_index: spectraIndex,
      click_count: this.clickCount,
      scroll_count: this.scrollCount,
      input_count: this.inputCount,
      total_duration_sec: Math.round(durationSec * 10) / 10,
      backtrack_count: this.backtrackCount,
      dead_end_count: this.deadEndCount,
      wcag_violations_count: this.findings.filter(f => f.category === "DETERMINISTIC").length
    };
  }
}
