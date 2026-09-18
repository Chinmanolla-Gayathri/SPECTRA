import React, { useState } from "react";
import { X, Play, Sparkles, Shield, Compass, Sliders } from "lucide-react";

interface NewAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    goal: string;
    entry_url: string;
    max_steps: number;
    max_paths: number;
    exploration_enabled: boolean;
  }) => void;
}

export const NewAuditModal: React.FC<NewAuditModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [goal, setGoal] = useState("Find blue running shoes under ₹5000 and reach checkout as guest");
  const [entryUrl, setEntryUrl] = useState("http://localhost:3000/demo-app");
  const [maxSteps, setMaxSteps] = useState(15);
  const [maxPaths, setMaxPaths] = useState(3);
  const [explorationEnabled, setExplorationEnabled] = useState(true);
  const [safetyPolicy, setSafetyPolicy] = useState(true);

  if (!isOpen) return null;

  const handlePreset = (presetGoal: string, presetUrl: string) => {
    setGoal(presetGoal);
    setEntryUrl(presetUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      goal,
      entry_url: entryUrl,
      max_steps: maxSteps,
      max_paths: maxPaths,
      exploration_enabled: explorationEnabled
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Compass className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Launch Autonomous Audit</h2>
              <p className="text-xs text-zinc-400">Zero SDKs • Zero source-code edits • Black-box verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Presets */}
          <div>
            <label className="text-[11px] uppercase font-mono tracking-wider text-zinc-400 block mb-2">
              Quick Test Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handlePreset(
                    "Find blue running shoes under ₹5000 and reach checkout as guest",
                    "http://localhost:3000/demo-app"
                  )
                }
                className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-cyan-300 transition-colors"
              >
                👟 ApexAthletics (Blue Shoes &lt; ₹5000)
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePreset(
                    "Audit shopping cart accessibility and discover guest checkout button",
                    "http://localhost:3000/demo-app"
                  )
                }
                className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                🛒 Cart WCAG &amp; Contrast Audit
              </button>
            </div>
          </div>

          {/* Goal Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1">
              Natural-Language Testing Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 font-sans"
              placeholder="e.g. Find blue running shoes under ₹5000 and reach checkout as guest"
            />
          </div>

          {/* Target URL */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1">
              Target Application URL
            </label>
            <input
              type="url"
              value={entryUrl}
              onChange={(e) => setEntryUrl(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
              placeholder="http://localhost:3000/demo-app"
            />
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Max Exploration Steps</span>
                <span className="font-mono text-cyan-400 font-semibold">{maxSteps}</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Beam Search Width (Paths)</span>
                <span className="font-mono text-cyan-400 font-semibold">{maxPaths}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={maxPaths}
                onChange={(e) => setMaxPaths(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Safety Policy */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-medium text-zinc-200">Action Safety Policy</div>
                <div className="text-[11px] text-zinc-500">Block destructive actions (account delete, payment execution)</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={safetyPolicy}
              onChange={(e) => setSafetyPolicy(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Autonomous Run</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
