import React from "react";
import { X, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { FullAuditRun, UXFinding, StepRecord } from "../types";

interface EvidenceModalProps {
  audit: FullAuditRun;
  finding?: UXFinding | null;
  step?: StepRecord | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  audit,
  finding,
  step,
  onClose,
}) => {
  const steps = audit.steps || [];

  // If a finding was provided, locate its associated step
  const activeStep = step || (finding ? steps.find(s => s.step_number === finding.step_number) : steps[steps.length - 1]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Visual Evidence Inspection</h2>
              <p className="text-xs text-zinc-400 font-mono">
                {activeStep ? `Step ${activeStep.step_number} &bull; ${activeStep.url}` : audit.goal.entry_url}
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {finding && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                  {finding.severity}
                </span>
                <span className="text-xs font-mono text-zinc-400">{finding.wcag_rule || finding.category}</span>
                <span className="text-xs text-zinc-400 font-medium">Confidence: {Math.round((finding.confidence || 0.9) * 100)}%</span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">{finding.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">{finding.description}</p>
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300">
                <strong className="text-sky-400 mr-1 font-semibold">Remediation:</strong>
                {finding.recommendation}
              </div>
            </div>
          )}

          {/* Screenshot Container */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden aspect-[16/10] flex items-center justify-center relative">
            {activeStep?.screenshot_data_url ? (
              <img
                src={activeStep.screenshot_data_url}
                alt="Captured State Screenshot"
                className="w-full h-full object-contain"
              />
            ) : activeStep?.screenshot_svg ? (
              <div
                dangerouslySetInnerHTML={{ __html: activeStep.screenshot_svg }}
                className="w-full h-full flex items-center justify-center"
              />
            ) : (
              <span className="text-xs text-zinc-400">No screenshot recorded for this state</span>
            )}

            {/* Step Badge */}
            {activeStep && (
              <div className="absolute top-3 right-3 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 px-3 py-1 rounded-md text-xs font-mono text-zinc-300">
                Step {activeStep.step_number} of {steps.length}
              </div>
            )}
          </div>

          {/* Step Action & Observed Summary */}
          {activeStep && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                <div className="text-zinc-400 uppercase text-[10px] mb-1 font-bold">Action Taken</div>
                <div className="text-sky-300 font-semibold">{activeStep.action_type.toUpperCase()} &rarr; {activeStep.semantic_target}</div>
              </div>
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                <div className="text-zinc-400 uppercase text-[10px] mb-1 font-bold">Target State URL</div>
                <div className="text-zinc-200 truncate">{activeStep.url}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
