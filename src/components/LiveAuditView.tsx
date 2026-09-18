import React, { useState } from "react";
import { 
  Play, Pause, Square, ExternalLink, ShieldAlert, ArrowRight,
  Layers, Compass, Clock, CheckCircle2, ChevronRight, ChevronDown, Activity, AlertCircle
} from "lucide-react";
import { StepRecord, UXFinding, FullAuditRun } from "../types";

interface LiveAuditViewProps {
  audit: FullAuditRun;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onViewResults: () => void;
  isPaused: boolean;
}

export const LiveAuditView: React.FC<LiveAuditViewProps> = ({
  audit,
  onPause,
  onResume,
  onStop,
  onViewResults,
  isPaused,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const steps = audit.steps || [];
  const currentStepRecord: StepRecord | undefined = steps[steps.length - 1];
  const isRunning = audit.status === "RUNNING";
  const isDone = audit.status === "GOAL_REACHED" || audit.status === "COMPLETED" || audit.status === "STOPPED" || audit.status === "UNEXPECTED_STATE";

  // Build the simple activity timeline items
  const timelineItems = [
    { label: "Browser session initialized", done: steps.length > 0 },
    { label: `Connected to ${audit.goal.entry_url}`, done: steps.length > 0 },
    { label: "Captured live visual & accessibility tree", done: steps.length > 0 },
    { label: `Autonomous exploration step ${audit.current_step || 1}`, active: isRunning, done: isDone },
    { label: isDone ? `Audit concluded (${audit.status})` : "Synthesizing next optimal path", active: !isDone, done: isDone }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Context & Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`}></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {isRunning ? (isPaused ? "Audit Paused" : "Autonomous Exploration in Progress") : `Audit ${audit.status}`}
            </span>
            {audit.is_demo && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Demo Target
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-zinc-100 truncate">
              {audit.goal.raw_goal}
            </h1>
          </div>
          <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
            <div>
              Target: <span className="text-sky-400">{currentStepRecord?.url || audit.goal.entry_url}</span>
            </div>
            {currentStepRecord?.current_subgoal && (
              <div className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                <span>&bull;</span>
                <span>Subgoal: {currentStepRecord.current_subgoal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {isRunning ? (
            <>
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  Pause
                </button>
              )}
              <button
                onClick={onStop}
                className="px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Square className="w-3 h-3 fill-red-400 text-red-400" />
                Stop Audit
              </button>
            </>
          ) : (
            <button
              onClick={onViewResults}
              className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <span>View Full Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Large Live Browser Viewport (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Browser Address Bar Header */}
          <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-zinc-800"></span>
              <span className="w-3 h-3 rounded-full bg-zinc-800"></span>
              <span className="w-3 h-3 rounded-full bg-zinc-800"></span>
            </div>
            <div className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-md px-3 py-1 text-xs font-mono text-zinc-300 truncate flex items-center justify-between">
              <span>{currentStepRecord?.url || audit.goal.entry_url}</span>
              <span className="text-[10px] text-zinc-400 uppercase font-sans">
                {currentStepRecord?.page_title ? currentStepRecord.page_title.slice(0, 30) : "Live Page"}
              </span>
            </div>
            <span className="text-[11px] font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800">
              Step {audit.current_step || 1}
            </span>
          </div>

          {/* Browser Screen Content */}
          <div className="relative aspect-[16/10] bg-zinc-950 flex items-center justify-center overflow-hidden">
            {currentStepRecord?.screenshot_data_url ? (
              <img
                src={currentStepRecord.screenshot_data_url}
                alt="Target Website Live State"
                className="w-full h-full object-contain bg-zinc-950"
              />
            ) : currentStepRecord?.screenshot_svg ? (
              <div
                dangerouslySetInnerHTML={{ __html: currentStepRecord.screenshot_svg }}
                className="w-full h-full flex items-center justify-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-zinc-300">Acquiring live browser viewport...</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Navigating to {audit.goal.entry_url} and analyzing DOM semantics.
                </p>
              </div>
            )}

            {/* Error Overlay if any */}
            {audit.error_message && (
              <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-red-300">
                <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                <h3 className="text-sm font-bold text-red-200 mb-1">Execution Interrupted</h3>
                <p className="text-xs text-red-300/90 max-w-md">{audit.error_message}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Activity Timeline & Action Understanding (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Prominent Current Action Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                Current Autonomous Action
              </span>
              <span className="font-mono text-zinc-400 text-[10px]">
                STEP {audit.current_step || 1}
              </span>
            </div>

            {/* Action Hierarchy: USER GOAL, SUBGOAL, ACTION */}
            <div className="space-y-2.5 mb-4">
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  USER GOAL
                </div>
                <div className="text-xs font-medium text-zinc-200 mt-0.5">
                  {audit.goal.raw_goal}
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                  CURRENT SUBGOAL
                </div>
                <div className="text-xs font-semibold text-emerald-200 mt-0.5">
                  {currentStepRecord?.current_subgoal || audit.goal.current_subgoal || "Explore target catalog"}
                </div>
              </div>

              <div className="bg-zinc-950 border border-sky-900/40 rounded-xl p-3">
                <div className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
                  CURRENT ACTION: <span className="uppercase text-sky-200 font-bold">{currentStepRecord?.action_type || "NAVIGATING"}</span>
                </div>
                <div className="text-sm font-bold text-zinc-100 mt-0.5">
                  {currentStepRecord?.semantic_target || `Connect to ${audit.goal.entry_url}`}
                </div>
              </div>
            </div>

            {/* Structured Explanations */}
            <div className="space-y-2.5 text-xs">
              {currentStepRecord?.observed && (
                <div>
                  <span className="font-bold text-zinc-400 block text-[11px] mb-0.5">OBSERVED:</span>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                    {currentStepRecord.observed}
                  </p>
                </div>
              )}

              {currentStepRecord?.reasoning && (
                <div>
                  <span className="font-bold text-zinc-400 block text-[11px] mb-0.5">REASON:</span>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                    {currentStepRecord.reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Structured Task Requirements Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Structured Objectives</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-sky-400 font-mono">
                {audit.goal.intent?.replace(/_/g, " ").toUpperCase()}
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              {audit.goal.semantic_search_query && (
                <div className="bg-zinc-950/60 border border-zinc-800/70 p-2.5 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                    Semantic Search Query:
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    "{audit.goal.semantic_search_query}"
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {audit.goal.category && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[11px]">
                    Category: <strong className="text-zinc-100">{audit.goal.category}</strong>
                  </span>
                )}
                {audit.goal.attributes?.color && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-950/40 border border-yellow-800/50 text-yellow-300 text-[11px]">
                    Color: <strong>{audit.goal.attributes.color}</strong>
                  </span>
                )}
                {audit.goal.attributes?.size && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[11px]">
                    Size: <strong className="text-zinc-100">{audit.goal.attributes.size}</strong>
                  </span>
                )}
                {audit.goal.constraints?.max_price && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[11px]">
                    Max Price: <strong>{audit.goal.constraints.currency || "₹"}{audit.goal.constraints.max_price}</strong>
                  </span>
                )}
                {audit.goal.constraints?.checkout_type && audit.goal.constraints.checkout_type !== "any" && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-950/40 border border-purple-800/50 text-purple-300 text-[11px]">
                    Checkout: <strong>{audit.goal.constraints.checkout_type}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Simple Activity Timeline */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3.5">
              Activity Timeline
            </h3>

            <div className="space-y-3">
              {timelineItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : item.active ? (
                    <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin flex-shrink-0 mt-0.5"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700 flex-shrink-0 mt-0.5"></div>
                  )}
                  <span className={item.done ? "text-zinc-200" : item.active ? "text-sky-300 font-medium" : "text-zinc-400"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compact Metrics Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-zinc-100">{steps.length}</div>
              <div className="text-[10px] text-zinc-400 uppercase">States</div>
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-100">{Math.max(1, audit.graph?.edges?.length || 1)}</div>
              <div className="text-[10px] text-zinc-400 uppercase">Paths</div>
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-100">{audit.current_step || 1}</div>
              <div className="text-[10px] text-zinc-400 uppercase">Steps</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">{audit.findings?.length || 0}</div>
              <div className="text-[10px] text-zinc-400 uppercase">Findings</div>
            </div>
          </div>

          {/* Expandable Technical Details (Progressive Disclosure) */}
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full bg-zinc-900/70 hover:bg-zinc-900 px-4 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-between transition-colors"
            >
              <span>Technical details</span>
              {showTechnicalDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showTechnicalDetails && (
              <div className="p-3.5 bg-zinc-950 font-mono text-[11px] text-zinc-400 space-y-1.5 border-t border-zinc-800">
                <div>State ID: <span className="text-zinc-200">{currentStepRecord?.state_id || "initializing"}</span></div>
                <div>Status: <span className="text-zinc-200">{audit.status}</span></div>
                <div>Step Latency: <span className="text-zinc-200">{currentStepRecord?.latency_ms || 0}ms</span></div>
                <div>Alternative Candidates: <span className="text-zinc-200">{currentStepRecord?.active_candidates?.length || 0} ranked paths</span></div>
                <div>State Fingerprint: <span className="text-zinc-300">{currentStepRecord?.url?.slice(0, 40) || "n/a"}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
