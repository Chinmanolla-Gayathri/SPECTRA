import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Layers,
  Compass,
  Clock,
  MousePointer
} from "lucide-react";
import { FullAuditRun, StepRecord } from "../types";

interface ReplayViewProps {
  auditRun: FullAuditRun | null;
}

export const ReplayView: React.FC<ReplayViewProps> = ({ auditRun }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const steps: StepRecord[] = auditRun?.steps || [];
  const totalSteps = steps.length;
  const currentStep: StepRecord | undefined = steps[currentStepIndex];

  // Auto-play loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && totalSteps > 0) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalSteps]);

  if (!auditRun || totalSteps === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
        <Clock className="w-12 h-12 text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-300">No Replay Recorded</h3>
        <p className="text-xs text-zinc-500">Execute an audit run to generate scrubbable playback evidence.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] bg-zinc-950 overflow-hidden">
      {/* Replay Scrub Bar */}
      <div className="px-6 py-3 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-all font-bold shadow-md shadow-cyan-500/20"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentStepIndex(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={currentStepIndex >= totalSteps - 1}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs font-mono text-zinc-300 ml-2">
            Step {currentStepIndex + 1} of {totalSteps}
          </div>
        </div>

        {/* Step Slider */}
        <div className="flex-1 max-w-xl mx-8 flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-500">1</span>
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={currentStepIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStepIndex(Number(e.target.value));
            }}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <span className="text-[11px] font-mono text-zinc-500">{totalSteps}</span>
        </div>

        {/* Status indicator */}
        <div className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
          Replaying: {auditRun.id}
        </div>
      </div>

      {/* Split Replay Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Frame Viewport */}
        <div className="col-span-12 lg:col-span-7 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center justify-center p-6 relative">
          {currentStep?.screenshot_svg && (
            <div className="relative w-full max-w-2xl aspect-[16/10] rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex items-center justify-center">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: currentStep.screenshot_svg }}
              />

              {currentStep.cursor_pos && (
                <div
                  className="absolute pointer-events-none transition-all duration-300 z-30"
                  style={{
                    left: `${(currentStep.cursor_pos.x / 800) * 100}%`,
                    top: `${(currentStep.cursor_pos.y / 500) * 100}%`,
                  }}
                >
                  <MousePointer className="w-5 h-5 text-cyan-400 fill-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step Diagnostics Panel */}
        <div className="col-span-12 lg:col-span-5 bg-zinc-950 p-6 flex flex-col space-y-5 overflow-y-auto">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
              Active Step URL
            </span>
            <div className="text-xs font-mono text-cyan-400 bg-zinc-900 p-2.5 rounded border border-zinc-800 break-all">
              {currentStep?.url}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
              Action Taken
            </span>
            <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-xs border border-cyan-800 uppercase">
                {currentStep?.action_type}
              </span>
              <span>{currentStep?.semantic_target}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
              Agent Decision Heuristic &amp; Grounding
            </span>
            <p className="text-xs text-zinc-300 bg-zinc-900 p-3 rounded border border-zinc-800 leading-relaxed">
              {currentStep?.reasoning}
            </p>
          </div>

          {currentStep?.findings_in_step && currentStep.findings_in_step.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">
                Violations Uncovered In This Step
              </span>
              <div className="space-y-2">
                {currentStep.findings_in_step.map((f, i) => (
                  <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">{f.title}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{f.category}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
