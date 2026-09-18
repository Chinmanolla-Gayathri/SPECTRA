/**
 * SPECTRA - Express API Router
 * Dynamic Autonomous Testing API
 */

import { Router, Request, Response } from "express";
import { parseGoalWithGemini } from "./gemini";
import { ExecutionOrchestrator } from "./orchestrator";
import { getApexAthleticsDemoGoal } from "./demoFixture";
import { journeyStorage, replaySavedJourney } from "./journeyManager";
import { SavedJourney } from "../src/types";

export const apiRouter = Router();

// In-memory run repository
export const runs = new Map<string, {
  id: string;
  orchestrator: ExecutionOrchestrator;
  createdAt: number;
  isDemo: boolean;
}>();

// 1. Create Audit Run
apiRouter.post("/audits", async (req: Request, res: Response) => {
  try {
    const {
      goal,
      entry_url,
      is_demo = false,
      max_steps = 10,
      max_paths = 3
    } = req.body;

    let targetUrl = (entry_url || "").trim();
    let targetGoal = (goal || "").trim();
    const isDemoRun = Boolean(is_demo) || targetUrl.includes("demo-app");

    if (isDemoRun && !targetUrl) {
      const demoData = getApexAthleticsDemoGoal();
      targetUrl = demoData.entry_url;
      if (!targetGoal) targetGoal = demoData.raw_goal;
    }

    if (!targetUrl) {
      return res.status(400).json({ error: "Target URL is required." });
    }
    if (!targetGoal) {
      return res.status(400).json({ error: "User goal is required." });
    }

    // Ensure valid protocol for real web exploration
    if (!isDemoRun && !/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const parsedGoal = await parseGoalWithGemini(targetGoal, targetUrl, max_steps, max_paths);

    const orchestrator = new ExecutionOrchestrator(runId, parsedGoal, isDemoRun);
    runs.set(runId, {
      id: runId,
      orchestrator,
      createdAt: Date.now(),
      isDemo: isDemoRun
    });

    res.status(201).json({
      run_id: runId,
      goal: parsedGoal,
      is_demo: isDemoRun,
      status: "READY"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create audit" });
  }
});

// 2. Quick Demo Launcher
apiRouter.post("/audits/demo", async (_req: Request, res: Response) => {
  try {
    const demoData = getApexAthleticsDemoGoal();
    const runId = `demo_${Date.now().toString(36)}`;
    const orchestrator = new ExecutionOrchestrator(runId, demoData as any, true);
    
    runs.set(runId, {
      id: runId,
      orchestrator,
      createdAt: Date.now(),
      isDemo: true
    });

    res.status(201).json({
      run_id: runId,
      goal: demoData,
      is_demo: true,
      status: "READY"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to launch demo" });
  }
});

// 3. List Audits
apiRouter.get("/audits", (_req: Request, res: Response) => {
  const list = Array.from(runs.values()).map(r => {
    const orch = r.orchestrator;
    const duration = orch.steps.length > 0 ? (Date.now() - orch.startTime) / 1000 : 0;
    const friction = orch.computeFrictionMetrics(duration);

    return {
      id: r.id,
      goal: orch.goal,
      is_demo: r.isDemo,
      status: orch.isRunning ? "RUNNING" : (orch.currentState || "READY"),
      goal_achieved: orch.goalAchieved,
      termination_reason: orch.terminationReason,
      termination_explanation: orch.terminationExplanation,
      step_count: orch.currentStep,
      duration_sec: Math.round(duration * 10) / 10,
      task_effort: orch.taskEffort,
      friction_index: friction.spectra_friction_index,
      findings_count: orch.findings.length,
      successful_paths_count: orch.successfulPaths.length,
      createdAt: r.createdAt,
      error_message: orch.errorMessage
    };
  }).sort((a, b) => b.createdAt - a.createdAt);

  res.json(list);
});

// 4. Get Single Audit
apiRouter.get("/audits/:id", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Audit not found" });

  const orch = item.orchestrator;
  const duration = orch.steps.length > 0 ? (Date.now() - orch.startTime) / 1000 : 0;
  const friction = orch.computeFrictionMetrics(duration);

  const runStats = {
    paths_explored: orch.edges.length + 1,
    successful_paths_count: orch.successfulPaths.length,
    dead_ends_count: orch.deadEndCount,
    loops_count: orch.loopCount,
    blocked_states_count: orch.blockedStatesCount,
    action_failures_count: orch.actionFailuresCount
  };

  res.json({
    id: item.id,
    goal: orch.goal,
    is_demo: item.isDemo,
    status: orch.isRunning ? "RUNNING" : orch.currentState,
    goal_achieved: orch.goalAchieved,
    termination_reason: orch.terminationReason,
    termination_explanation: orch.terminationExplanation,
    current_step: orch.currentStep,
    duration_sec: Math.round(duration * 10) / 10,
    task_effort: orch.taskEffort,
    friction_metrics: friction,
    successful_paths: orch.successfulPaths,
    recommended_journey: orch.recommendedJourney,
    stats: runStats,
    findings: orch.findings,
    graph: orch.getGraph(),
    steps: orch.steps,
    error_message: orch.errorMessage
  });
});

// 5. Start Audit
apiRouter.post("/audits/:id/start", async (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Audit not found" });

  const orch = item.orchestrator;
  if (!orch.isRunning) {
    orch.start().catch((err) => {
      console.error("Audit start error:", err);
    });
  }

  res.json({ status: "STARTED", run_id: item.id });
});

// 6. Stop Audit
apiRouter.post("/audits/:id/stop", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Audit not found" });

  item.orchestrator.stop();
  res.json({ status: "STOPPED", run_id: item.id });
});

// 7. Pause / Resume
apiRouter.post("/audits/:id/pause", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Audit not found" });
  item.orchestrator.pause();
  res.json({ status: "PAUSED" });
});

apiRouter.post("/audits/:id/resume", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Audit not found" });
  item.orchestrator.resume();
  res.json({ status: "RESUMED" });
});

// 8. Server-Sent Events (SSE)
apiRouter.get("/audits/:id/events", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).send("Audit not found");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const listener = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  item.orchestrator.addEventListener(listener);

  // Send current initial sync
  res.write(`data: ${JSON.stringify({
    type: "INITIAL_SYNC",
    run_id: item.id,
    status: item.orchestrator.currentState,
    goal_achieved: item.orchestrator.goalAchieved,
    termination_reason: item.orchestrator.terminationReason,
    current_step: item.orchestrator.currentStep,
    is_running: item.orchestrator.isRunning,
    task_effort: item.orchestrator.taskEffort,
    successful_paths: item.orchestrator.successfulPaths,
    recommended_journey: item.orchestrator.recommendedJourney,
    graph: item.orchestrator.getGraph(),
    steps: item.orchestrator.steps,
    findings: item.orchestrator.findings,
    error_message: item.orchestrator.errorMessage
  })}\n\n`);

  req.on("close", () => {
    item.orchestrator.removeEventListener(listener);
  });
});

// 9. Save Recommended Journey for Regression Testing
apiRouter.post("/audits/:id/save-journey", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Audit not found" });

  const orch = item.orchestrator;
  const journey = orch.recommendedJourney || orch.successfulPaths[0];

  if (!journey) {
    return res.status(400).json({ error: "No successful journey available to save for this audit." });
  }

  const saved: SavedJourney = {
    id: `journey_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: Date.now(),
    target_url: orch.goal.entry_url,
    raw_goal: orch.goal.raw_goal,
    structured_goal: orch.goal,
    recommended_journey: journey,
    expected_success_criteria: orch.goal.success_conditions || ["Verify goal requirements"],
    baseline_metrics: {
      step_count: journey.step_count,
      duration_sec: journey.duration_sec,
      backtracks: journey.backtracks,
      loops: journey.loop_count,
      effort_level: journey.task_effort?.level || "LOW",
      findings_count: orch.findings.length
    },
    tags: req.body.tags || ["autonomous-baseline"]
  };

  journeyStorage.save(saved);
  res.status(201).json(saved);
});

// 10. List Saved Journeys
apiRouter.get("/journeys", (_req: Request, res: Response) => {
  res.json(journeyStorage.list());
});

// 11. Get Single Saved Journey
apiRouter.get("/journeys/:id", (req: Request, res: Response) => {
  const item = journeyStorage.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Saved journey not found" });
  res.json(item);
});

// 12. Replay Journey (Regression Flow Verification)
apiRouter.post("/journeys/:id/replay", async (req: Request, res: Response) => {
  const item = journeyStorage.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Saved journey not found" });

  try {
    const isSimulated = req.body.is_simulated ?? item.target_url.includes("demo-app");
    const result = await replaySavedJourney(item, {
      targetUrlOverride: req.body.target_url_override,
      isSimulated: isSimulated
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to replay journey" });
  }
});

// 13. Delete Saved Journey
apiRouter.delete("/journeys/:id", (req: Request, res: Response) => {
  const success = journeyStorage.delete(req.params.id);
  if (!success) return res.status(404).json({ error: "Saved journey not found" });
  res.json({ status: "DELETED", id: req.params.id });
});

// 14. Structured Report JSON
apiRouter.get("/audits/:id/report", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).json({ error: "Audit not found" });

  const orch = item.orchestrator;
  const duration = (Date.now() - orch.startTime) / 1000;
  const friction = orch.computeFrictionMetrics(duration);

  res.json({
    run_id: item.id,
    goal: orch.goal,
    is_demo: item.isDemo,
    status: orch.currentState,
    goal_achieved: orch.goalAchieved,
    termination_reason: orch.terminationReason,
    termination_explanation: orch.terminationExplanation,
    total_steps: orch.currentStep,
    duration_sec: Math.round(duration * 10) / 10,
    task_effort: orch.taskEffort,
    friction_metrics: friction,
    successful_paths: orch.successfulPaths,
    recommended_journey: orch.recommendedJourney,
    findings: orch.findings,
    steps: orch.steps,
    graph: orch.getGraph(),
    error_message: orch.errorMessage
  });
});

// 10. Standalone HTML Report
apiRouter.get("/audits/:id/report/html", (req: Request, res: Response) => {
  const item = runs.get(req.params.id);
  if (!item) return res.status(404).send("Audit not found");

  const orch = item.orchestrator;
  const duration = (Date.now() - orch.startTime) / 1000;
  const friction = orch.computeFrictionMetrics(duration);

  const a11yFindings = orch.findings.filter(f => f.category === "DETERMINISTIC");
  const uxFindings = orch.findings.filter(f => f.category === "OBSERVED" || f.category === "AI_INFERRED");

  const renderFindingList = (list: typeof orch.findings) => {
    if (list.length === 0) return `<p style="color:#64748b; font-size:13px;">No violations detected.</p>`;
    return list.map(f => `
      <div style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:14px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <div>
            <span style="background:${f.severity === 'CRITICAL' || f.severity === 'HIGH' ? '#dc2626' : '#d97706'}; color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700;">${f.severity}</span>
            <span style="color:#94a3b8; font-size:12px; margin-left:8px;">${f.wcag_rule || f.category}</span>
          </div>
          <span style="color:#64748b; font-size:12px;">Step ${f.step_number}</span>
        </div>
        <h4 style="color:#f8fafc; font-size:14px; margin:6px 0;">${f.title}</h4>
        <p style="color:#94a3b8; font-size:13px; margin:4px 0 8px 0;">${f.description}</p>
        <div style="background:#1e293b; padding:8px 12px; border-radius:4px; font-size:12px; color:#cbd5e1;">
          <strong>Remediation:</strong> ${f.recommendation}
        </div>
      </div>
    `).join("");
  };

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>SPECTRA Audit Report - ${orch.goal.entry_url}</title>
    <style>
      body { background:#020617; color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding:40px; max-width:960px; margin:0 auto; line-height:1.6; }
      .header { border-bottom:1px solid #1e293b; padding-bottom:24px; margin-bottom:32px; }
      .metrics { display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:36px; }
      .m-card { background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:20px; text-align:center; }
      .m-val { font-size:32px; font-weight:700; color:#38bdf8; }
      .m-lbl { font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
      h2 { font-size:18px; color:#e2e8f0; margin:32px 0 16px 0; border-bottom:1px solid #1e293b; padding-bottom:8px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div style="font-size:14px; font-weight:700; color:#38bdf8; letter-spacing:1px;">SPECTRA // AUTONOMOUS AUDIT REPORT</div>
      <h1 style="font-size:24px; margin:12px 0 8px 0;">${orch.goal.raw_goal}</h1>
      <div style="color:#94a3b8; font-size:14px;">
        Target: <strong style="color:#f8fafc;">${orch.goal.entry_url}</strong> &bull; Status: <strong style="color:#10b981;">${orch.currentState}</strong>
      </div>
    </div>

    <div class="metrics">
      <div class="m-card">
        <div class="m-val">${orch.steps.length}</div>
        <div class="m-lbl">States Explored</div>
      </div>
      <div class="m-card">
        <div class="m-val">${orch.edges.length + 1}</div>
        <div class="m-lbl">Paths Explored</div>
      </div>
      <div class="m-card">
        <div class="m-val">${orch.findings.length}</div>
        <div class="m-lbl">Total Findings</div>
      </div>
      <div class="m-card">
        <div class="m-val">${friction.spectra_friction_index}</div>
        <div class="m-lbl">UX Friction (0-100)</div>
      </div>
    </div>

    <h2>Accessibility Findings (WCAG 2.1)</h2>
    ${renderFindingList(a11yFindings)}

    <h2>UX & Interaction Friction Findings</h2>
    ${renderFindingList(uxFindings)}
  </body>
  </html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});
