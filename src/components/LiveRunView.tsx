import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Compass,
  FileCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  MousePointer,
  Maximize2
} from "lucide-react";
import { FullAuditRun, StepRecord, ExplorationCandidate, StateMachineState } from "../types";

interface LiveRunViewProps {
  auditRun: FullAuditRun | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onViewReport: () => void;
  isPaused: boolean;
}

export const LiveRunView: React.FC<LiveRunViewProps> = ({
  auditRun,
  onPause,
  onResume,
  onStop,
  onViewReport,
  isPaused
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<ExplorationCandidate | null>(null);

  const steps = auditRun?.steps || [];
  const latestStep: StepRecord | undefined = steps[steps.length - 1];
  const candidates: ExplorationCandidate[] = latestStep?.active_candidates || [];

  const getStatusBadge = (status?: StateMachineState | "RUNNING" | "READY" | "COMPLETED" | "STOPPED") => {
    switch (status) {
      case "GOAL_REACHED":
        return {
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          text: "GOAL REACHED",
          dot: "bg-emerald-400"
        };
      case "LOOP_DETECTED":
        return {
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          text: "LOOP DETECTED",
          dot: "bg-amber-400"
        };
      case "DEAD_END":
        return {
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          text: "DEAD END",
          dot: "bg-rose-400"
        };
      case "RUNNING":
        return {
          bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          text: "AUTONOMOUS RUNNING",
          dot: "bg-cyan-400 animate-pulse"
        };
      default:
        return {
          bg: "bg-zinc-800 text-zinc-300 border-zinc-700",
          text: status || "OBSERVING",
          dot: "bg-zinc-400"
        };
    }
  };

  const statusBadge = getStatusBadge(auditRun?.status);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] bg-zinc-950 overflow-hidden">
      {/* Control & Goal Bar */}
      <div className="px-6 py-3 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 flex-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold tracking-wider ${statusBadge.bg}`}>
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              {statusBadge.text}
            </span>
            <span className="font-mono text-xs text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700">
              Step {auditRun?.current_step || 0} / {auditRun?.goal?.max_steps || 15}
            </span>
          </div>

          <div className="truncate text-xs text-zinc-300 font-medium">
            <span className="text-zinc-500 font-mono mr-1.5">GOAL:</span>
            {auditRun?.goal?.raw_goal || "Autonomous Goal Execution"}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}

          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>

          <button
            onClick={onViewReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all ml-2"
          >
            <FileCheck className="w-3.5 h-3.5" />
            View Audit Report
          </button>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN (7 Cols): Live Screen Viewport */}
        <div className="col-span-12 lg:col-span-7 border-r border-zinc-800/80 bg-zinc-950 flex flex-col overflow-hidden">
          {/* Browser Chrome Header */}
          <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-md text-[11px] font-mono text-zinc-300 flex-1 max-w-xl truncate ml-2">
                {latestStep?.url || auditRun?.goal?.entry_url || "http://localhost:3000/demo-app"}
              </div>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 ml-4">
              <span>Latency: {latestStep?.latency_ms || 240}ms</span>
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="flex-1 relative bg-zinc-950 flex items-center justify-center p-6 overflow-hidden">
            {latestStep?.screenshot_svg ? (
              <div className="relative w-full max-w-2xl aspect-[16/10] rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex items-center justify-center">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: latestStep.screenshot_svg }}
                />

                {/* Simulated Cursor with ripple animation */}
                {latestStep.cursor_pos && (
                  <div
                    className="absolute pointer-events-none transition-all duration-700 ease-out z-30"
                    style={{
                      left: `${(latestStep.cursor_pos.x / 800) * 100}%`,
                      top: `${(latestStep.cursor_pos.y / 500) * 100}%`,
                    }}
                  >
                    <div className="relative">
                      <MousePointer className="w-5 h-5 text-cyan-400 fill-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      <span className="absolute -inset-2 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <RefreshCw className="w-8 h-8 animate-spin mb-2 text-zinc-600" />
                <span className="text-xs font-mono">Initializing Chromium Black-Box Controller...</span>
              </div>
            )}
          </div>

          {/* Current Step Action Bar */}
          <div className="p-4 bg-zinc-900/90 border-t border-zinc-800">
            <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Executed Action Heuristic</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-xs border border-cyan-800 uppercase">
                  {latestStep?.action_type || "OBSERVE"}
                </span>
                <span>{latestStep?.semantic_target || "Analyzing DOM & Accessibility Tree"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Real-time SSE Agent Activity & Beam Search */}
        <div className="col-span-12 lg:col-span-5 bg-zinc-950 flex flex-col overflow-y-auto">
          {/* 1. Reasoning Summary (Structured Facts vs Plan) */}
          <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Agent Decision Rationale</span>
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Gemini 3.8 Flash</span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 text-xs leading-relaxed space-y-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono mr-1.5">
                  [OBSERVED]:
                </span>
                <span className="text-zinc-300">
                  {latestStep ? `Detected UI state at ${latestStep.url}. Interactive candidates prioritized.` : "Scanning DOM candidates and accessible labels."}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono mr-1.5">
                  [AI_INFERRED PLAN]:
                </span>
                <span className="text-zinc-400">
                  {latestStep?.reasoning || "Goal parser mapped criteria to action candidate ranking."}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Beam Search Candidates & Priority Heuristic */}
          <div className="p-5 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exploration Beam (Ranked by Priority)</span>
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  priority = 0.35*relevance + 0.25*novelty + 0.20*success + 0.20*coverage
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {candidates.length > 0 ? (
                candidates.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                      idx === 0
                        ? "bg-cyan-950/30 border-cyan-800/60 hover:border-cyan-500"
                        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center font-mono">
                          {c.path_id}
                        </span>
                        {c.target_semantic}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                          P: {c.priority}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[10px] text-zinc-400 font-mono mt-2 pt-2 border-t border-zinc-800/60">
                      <div>Rel: {c.goal_relevance}</div>
                      <div>Nov: {c.novelty}</div>
                      <div>Succ: {c.estimated_success}</div>
                      <div>Cov: {c.unexplored_coverage}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500 text-center py-4 font-mono">
                  No active candidate paths queued.
                </div>
              )}
            </div>
          </div>

          {/* 3. Real-Time Findings Stream */}
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected Violations & Friction</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                {auditRun?.findings?.length || 0} issues discovered
              </span>
            </div>

            <div className="space-y-2">
              {auditRun?.findings && auditRun.findings.length > 0 ? (
                auditRun.findings.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          f.category === "DETERMINISTIC"
                            ? "bg-blue-950 text-blue-300 border border-blue-800"
                            : f.category === "OBSERVED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-purple-950 text-purple-300 border border-purple-800"
                        }`}>
                          {f.category}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          {f.severity}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Step {f.step_number}</span>
                    </div>
                    <div className="font-semibold text-zinc-200">{f.title}</div>
                    <div className="text-zinc-400 text-[11px]">{f.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500 text-center py-6 font-mono">
                  Autonomous auditing in progress...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
