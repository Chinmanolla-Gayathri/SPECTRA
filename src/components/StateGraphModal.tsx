import React, { useState } from "react";
import { X, Network, ExternalLink, ArrowDown, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { FullAuditRun, StateGraphNode, StepRecord } from "../types";

interface StateGraphModalProps {
  audit: FullAuditRun;
  onClose: () => void;
  onOpenStepEvidence: (step: StepRecord) => void;
}

export const StateGraphModal: React.FC<StateGraphModalProps> = ({
  audit,
  onClose,
  onOpenStepEvidence,
}) => {
  const steps = audit.steps || [];
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);

  const activeStep = steps[selectedStepIndex] || steps[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Exploration State Graph</h2>
              <p className="text-xs text-zinc-400">
                State transition sequence &bull; Click any state to inspect observed DOM elements & evidence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns: Flow Map on Left, Detailed State Inspector on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left: State Sequence Flow (5 cols) */}
          <div className="md:col-span-5 border-r border-zinc-800 p-5 overflow-y-auto space-y-4 bg-zinc-950/40">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Discovered State Sequence
            </div>

            {/* Start Node */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <div className="flex items-center justify-between font-bold text-zinc-300 mb-1">
                <span>START</span>
                <span className="text-[10px] text-zinc-400 font-mono">Entrypoint</span>
              </div>
              <div className="font-mono text-sky-400 truncate text-[11px]">{audit.goal.entry_url}</div>
            </div>

            {/* Step States with Arrows */}
            {steps.map((step, idx) => {
              const isSelected = idx === selectedStepIndex;
              const isLast = idx === steps.length - 1;
              const isGoalReached = step.status === "GOAL_REACHED";

              return (
                <React.Fragment key={step.state_id || idx}>
                  {/* Transition Arrow with Action Label */}
                  <div className="flex items-center gap-2 px-2 text-[11px] text-zinc-400">
                    <ArrowDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 truncate text-zinc-300">
                      {step.action_type}: {step.semantic_target.slice(0, 25)}
                    </span>
                  </div>

                  {/* State Card */}
                  <div
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-sky-950/40 border-sky-500 shadow-md"
                        : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-zinc-200">
                        State {step.step_number}: {step.page_title ? step.page_title.slice(0, 20) : `View ${idx + 1}`}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isGoalReached ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                        step.status === "LOOP_DETECTED" ? "bg-purple-950 text-purple-300 border border-purple-800" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {step.status}
                      </span>
                    </div>
                    <div className="font-mono text-zinc-400 text-[11px] truncate mb-2">
                      {step.url}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Latency: {step.latency_ms}ms</span>
                      <span className="text-amber-400 font-semibold">{step.findings_in_step?.length || 0} findings</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Terminal Indicator */}
            {steps.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
                <span className="font-semibold">Terminal Evaluation:</span>
                <span className="font-bold">{audit.status}</span>
              </div>
            )}
          </div>

          {/* Right: State Details Inspector (7 cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-6">
            {activeStep ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono uppercase text-sky-400 font-semibold">
                      State Inspection &bull; Step {activeStep.step_number}
                    </span>
                    <h3 className="text-base font-bold text-zinc-100 mt-1">
                      {activeStep.page_title || "Discovered Page State"}
                    </h3>
                    <div className="font-mono text-xs text-zinc-400 mt-0.5">
                      {activeStep.url}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenStepEvidence(activeStep)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    Full Screenshot
                  </button>
                </div>

                {/* Screenshot Preview */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden aspect-[16/10] flex items-center justify-center">
                  {activeStep.screenshot_data_url ? (
                    <img
                      src={activeStep.screenshot_data_url}
                      alt={`State ${activeStep.step_number}`}
                      className="w-full h-full object-contain"
                    />
                  ) : activeStep.screenshot_svg ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: activeStep.screenshot_svg }}
                      className="w-full h-full flex items-center justify-center"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400">No screenshot available for this step</span>
                  )}
                </div>

                {/* Action Taken & Observation */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-zinc-400 block mb-0.5">ACTION EXECUTED:</span>
                    <span className="font-mono text-sky-300 font-semibold text-sm">
                      {activeStep.action_type.toUpperCase()} &rarr; {activeStep.semantic_target}
                    </span>
                  </div>

                  {activeStep.observed && (
                    <div>
                      <span className="font-bold text-zinc-400 block mb-0.5">OBSERVED ON INTERFACE:</span>
                      <p className="text-zinc-300 leading-relaxed">{activeStep.observed}</p>
                    </div>
                  )}

                  {activeStep.reasoning && (
                    <div>
                      <span className="font-bold text-zinc-400 block mb-0.5">REASONING:</span>
                      <p className="text-zinc-300 leading-relaxed">{activeStep.reasoning}</p>
                    </div>
                  )}
                </div>

                {/* Findings on this state */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Findings on this State ({activeStep.findings_in_step?.length || 0})
                  </h4>
                  {(!activeStep.findings_in_step || activeStep.findings_in_step.length === 0) ? (
                    <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      No violations detected during this step.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeStep.findings_in_step.map(f => (
                        <div key={f.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                              {f.severity}
                            </span>
                            <span className="font-bold text-zinc-200">{f.title}</span>
                          </div>
                          <p className="text-zinc-400 text-[11px] leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-zinc-400">
                Select a state from the left column to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
