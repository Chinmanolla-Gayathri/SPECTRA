import React, { useState, useEffect } from "react";
import { 
  Play, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Clock, 
  Trash2, ArrowRight, ExternalLink, RefreshCw, ShieldAlert, Sparkles,
  Layers, ChevronRight, Activity, Zap
} from "lucide-react";
import { SavedJourney, JourneyReplayResult } from "../types";

interface RegressionSuiteViewProps {
  onSelectAudit?: (id: string) => void;
  onNewAuditClick?: () => void;
}

export const RegressionSuiteView: React.FC<RegressionSuiteViewProps> = ({
  onSelectAudit,
  onNewAuditClick
}) => {
  const [journeys, setJourneys] = useState<SavedJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [replayResult, setReplayResult] = useState<JourneyReplayResult | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<SavedJourney | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/journeys");
      if (res.ok) {
        const data = await res.json();
        setJourneys(data);
        if (data.length > 0 && !selectedJourney) {
          setSelectedJourney(data[0]);
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load saved journeys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  const handleReplay = async (journey: SavedJourney) => {
    setReplayingId(journey.id);
    setReplayResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/journeys/${journey.id}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_simulated: journey.target_url.includes("demo-app") || journey.target_url.includes("localhost")
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Replay failed (HTTP ${res.status})`);
      }

      const result: JourneyReplayResult = await res.json();
      setReplayResult(result);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to execute journey replay");
    } finally {
      setReplayingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/journeys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJourneys(prev => prev.filter(j => j.id !== id));
        if (selectedJourney?.id === id) {
          setSelectedJourney(null);
          setReplayResult(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete journey", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Deterministic Regression Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
            Saved Journeys & Regression Suite
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Re-run verified autonomous navigation paths to detect broken selectors, missing steps, or flow regressions.
          </p>
        </div>

        <button
          onClick={fetchJourneys}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Suite
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
          <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-sm font-medium">Loading regression test suite...</div>
        </div>
      ) : journeys.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
          <ShieldAlert className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200 mb-1">No Saved Journeys Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
            When an autonomous audit successfully reaches its goal, click <strong>"Save as Baseline"</strong> to persist its optimal path here for automated regression testing.
          </p>
          {onNewAuditClick && (
            <button
              onClick={onNewAuditClick}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold transition-colors"
            >
              Start New Audit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Saved Journeys List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              Active Regression Baselines ({journeys.length})
            </div>

            {journeys.map((j) => {
              const isSelected = selectedJourney?.id === j.id;
              const isReplaying = replayingId === j.id;

              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedJourney(j)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-zinc-900 border-sky-500/60 shadow-md shadow-sky-500/5"
                      : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs text-sky-400 truncate max-w-[200px]">
                          {j.target_url}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                          {j.baseline_metrics.effort_level} EFFORT
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-2">
                        {j.raw_goal}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(j.id);
                      }}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                      title="Delete saved journey"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metrics Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-3">
                      <span><strong className="text-zinc-200">{j.baseline_metrics.step_count}</strong> steps</span>
                      <span>&bull;</span>
                      <span><strong className="text-zinc-200">{j.baseline_metrics.duration_sec}s</strong></span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJourney(j);
                        handleReplay(j);
                      }}
                      disabled={isReplaying}
                      className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                    >
                      {isReplaying ? (
                        <>
                          <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-zinc-950" />
                          <span>Replay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Journey Inspection & Live Replay Diff (7 cols) */}
          <div className="lg:col-span-7">
            {selectedJourney ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block mb-1">
                      Target Flow
                    </span>
                    <h3 className="text-base font-bold text-zinc-100">
                      {selectedJourney.raw_goal}
                    </h3>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      {selectedJourney.target_url}
                    </div>
                  </div>

                  <button
                    onClick={() => handleReplay(selectedJourney)}
                    disabled={replayingId === selectedJourney.id}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-md"
                  >
                    {replayingId === selectedJourney.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Executing Semantic Replay...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-zinc-950" />
                        <span>Run Regression Test</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Replay Result Banner (if executed) */}
                {replayResult && (
                  <div className={`p-4 rounded-xl border ${
                    replayResult.status === "SUCCESS" && !replayResult.potential_flow_regression
                      ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
                      : "bg-red-950/40 border-red-800/80 text-red-200"
                  }`}>
                    <div className="flex items-start gap-3">
                      {replayResult.status === "SUCCESS" && !replayResult.potential_flow_regression ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            replayResult.status === "SUCCESS" && !replayResult.potential_flow_regression
                              ? "bg-emerald-900 text-emerald-300"
                              : "bg-red-900 text-red-300"
                          }`}>
                            {replayResult.status === "SUCCESS" && !replayResult.potential_flow_regression
                              ? "FLOW INTACT & PASSING"
                              : "REGRESSION DETECTED"}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold mb-2">
                          {replayResult.status === "SUCCESS" 
                            ? "All semantic steps matched expected interface transitions without divergence."
                            : replayResult.failure_reason || "Flow diverged from baseline behavior."}
                        </p>

                        {/* Baseline vs Current Replay Diff Comparison */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80 text-xs">
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Baseline Steps</span>
                            <span className="font-bold text-zinc-100">{replayResult.baseline_metrics.step_count} steps</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Replayed Steps</span>
                            <span className="font-bold text-zinc-100">{replayResult.steps_completed} steps</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Baseline Duration</span>
                            <span className="font-bold text-zinc-100">{replayResult.baseline_metrics.duration_sec}s</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Replayed Duration</span>
                            <span className="font-bold text-zinc-100">{replayResult.duration_sec}s</span>
                          </div>
                        </div>

                        {/* If step failure exists */}
                        {replayResult.failed_at_step && (
                          <div className="mt-3 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300">
                            <span className="text-red-400 font-bold block mb-1">Step Divergence:</span>
                            Failed at step {replayResult.failed_at_step} 
                            {replayResult.failed_action && ` on "${replayResult.failed_action.target}"`}: {replayResult.failure_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expected Semantic Sequence */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
                    <span>Baseline Semantic Steps ({selectedJourney.recommended_journey.ordered_semantic_actions.length})</span>
                    <span className="text-[11px] text-zinc-500 font-normal">Deterministic semantic matching</span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedJourney.recommended_journey.ordered_semantic_actions.map((act, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-3 text-xs"
                      >
                        <span className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-[11px] flex-shrink-0">
                          {act.step_number}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.2 rounded font-mono font-bold uppercase text-[10px] bg-sky-950 text-sky-300 border border-sky-800">
                              {act.action}
                            </span>
                            <span className="font-bold text-zinc-200 font-mono truncate">
                              "{act.target}"
                            </span>
                          </div>

                          {act.observed_state && (
                            <div className="text-zinc-400 line-clamp-1">
                              {act.observed_state}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400">
                Select a journey from the left to view details or run regression tests.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
