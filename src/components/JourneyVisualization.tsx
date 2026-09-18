import React, { useState } from "react";
import { 
  CheckCircle2, ArrowRight, Eye, CornerDownRight, RotateCcw, 
  ExternalLink, Sparkles, Clock, Compass, ShieldCheck, BookmarkPlus,
  ChevronDown, ChevronUp, Layers
} from "lucide-react";
import { SuccessfulPath, SemanticAction, StepRecord } from "../types";

interface JourneyVisualizationProps {
  journey: SuccessfulPath;
  steps?: StepRecord[];
  onInspectStep?: (stepNumber: number) => void;
  onSaveJourney?: () => void;
  isSavingJourney?: boolean;
  journeySaved?: boolean;
}

export const JourneyVisualization: React.FC<JourneyVisualizationProps> = ({
  journey,
  steps = [],
  onInspectStep,
  onSaveJourney,
  isSavingJourney = false,
  journeySaved = false
}) => {
  const [viewLayout, setViewLayout] = useState<"cards" | "timeline">("cards");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const actions = journey.ordered_semantic_actions || [];

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "click":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "type":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "navigate":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "back":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl">
      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/90">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recommended Journey
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {journey.step_count} verified steps &bull; {journey.duration_sec}s
            </span>
          </div>
          <h2 className="text-lg font-bold text-zinc-100">
            Optimal Autonomous Navigation Path
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deterministic semantic sequence to satisfy: <strong className="text-zinc-200">"{journey.original_user_goal}"</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {onSaveJourney && (
            <button
              onClick={onSaveJourney}
              disabled={isSavingJourney || journeySaved}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                journeySaved
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default"
                  : "bg-sky-500 hover:bg-sky-400 text-zinc-950"
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{journeySaved ? "Saved as Regression Baseline" : isSavingJourney ? "Saving..." : "Save as Baseline"}</span>
            </button>
          )}

          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setViewLayout("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewLayout === "cards"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Step Cards
            </button>
            <button
              onClick={() => setViewLayout("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewLayout === "timeline"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* VIEW A: Step Cards with Visual Progression */}
      {viewLayout === "cards" ? (
        <div className="pt-6 space-y-4">
          {actions.map((act, index) => {
            const isLast = index === actions.length - 1;
            const matchingStep = steps.find(s => s.step_number === act.step_number);
            const isExpanded = expandedStep === act.step_number;

            return (
              <div key={index} className="relative">
                {/* Connecting Path Line */}
                {!isLast && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-sky-500/40 via-zinc-800 to-zinc-800 -mb-4 z-0 pointer-events-none" />
                )}

                <div className="relative z-10 bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 sm:p-5 transition-all shadow-sm group">
                  <div className="flex items-start justify-between gap-4">
                    {/* Step Number & Action Icon */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-xs font-bold text-zinc-200 flex-shrink-0 mt-0.5">
                        {act.step_number}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${getActionColor(act.action)}`}>
                            {act.action}
                          </span>

                          <span className="text-sm font-bold text-zinc-100 font-mono">
                            "{act.target}"
                          </span>

                          {act.value && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 font-mono">
                              Value: "{act.value}"
                            </span>
                          )}
                        </div>

                        {/* Page / State Context */}
                        <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 font-mono">
                          <span className="text-zinc-300 font-medium truncate max-w-sm">
                            {act.page_title || act.url || "Page"}
                          </span>
                          {act.url && (
                            <span className="text-zinc-500 truncate max-w-xs">
                              &bull; {act.url}
                            </span>
                          )}
                        </div>

                        {/* Observed State Result */}
                        {act.observed_state && (
                          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-300 flex items-start gap-2">
                            <span className="text-emerald-400 font-semibold flex-shrink-0">Observed:</span>
                            <span className="leading-relaxed">{act.observed_state}</span>
                          </div>
                        )}

                        {/* Reason Accordion / Detail */}
                        {act.reason && (
                          <div className="mt-2 text-xs text-zinc-400 leading-relaxed italic">
                            "{act.reason}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Screenshot preview / Inspect Button */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {matchingStep && onInspectStep && (
                        <button
                          onClick={() => onInspectStep(act.step_number)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 text-zinc-300 hover:text-zinc-100 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>Inspect Step</span>
                        </button>
                      )}

                      {act.screenshot_ref && (
                        <div 
                          onClick={() => matchingStep && onInspectStep?.(act.step_number)}
                          className="w-24 h-15 rounded-lg overflow-hidden border border-zinc-800 cursor-pointer hover:opacity-90 transition-opacity relative group/img hidden sm:block"
                        >
                          {act.screenshot_ref.startsWith("<svg") ? (
                            <div 
                              className="w-full h-full scale-[0.35] origin-top-left pointer-events-none"
                              dangerouslySetInnerHTML={{ __html: act.screenshot_ref }} 
                            />
                          ) : (
                            <img 
                              src={act.screenshot_ref} 
                              alt={`Step ${act.step_number}`}
                              className="w-full h-full object-cover object-top" 
                            />
                          )}
                          <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Goal Terminal State */}
          <div className="relative pt-2">
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-700 flex items-center justify-center text-emerald-300 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                    Goal State Verified
                  </div>
                  <div className="text-sm font-semibold text-zinc-100 mb-2">
                    All verifiable user goal requirements were satisfied along this path.
                  </div>
                  <div className="space-y-1.5">
                    {(journey.success_criteria_evidence || []).map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW B: Compact Linear Timeline */
        <div className="pt-6">
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center gap-3 min-w-max">
              {actions.map((act, index) => {
                const isLast = index === actions.length - 1;
                return (
                  <React.Fragment key={index}>
                    <div 
                      onClick={() => onInspectStep?.(act.step_number)}
                      className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 w-64 flex-shrink-0 cursor-pointer transition-all hover:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-400 font-mono">
                          Step {act.step_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getActionColor(act.action)}`}>
                          {act.action}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-zinc-100 truncate mb-1" title={act.target}>
                        {act.target}
                      </div>
                      <div className="text-xs text-zinc-400 line-clamp-2">
                        {act.observed_state || act.reason || act.page_title}
                      </div>
                    </div>

                    {!isLast && (
                      <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
