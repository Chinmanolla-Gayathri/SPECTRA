import React from "react";
import { Play, Plus, Activity, Layers, FileText, Cpu, ShieldCheck, ExternalLink } from "lucide-react";

interface HeaderProps {
  currentTab: "dashboard" | "live" | "graph" | "report" | "replay";
  setCurrentTab: (tab: "dashboard" | "live" | "graph" | "report" | "replay") => void;
  onOpenNewModal: () => void;
  activeRunId: string | null;
  isRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewModal,
  activeRunId,
  isRunning,
}) => {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Identity */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab("dashboard")}>
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-black text-sm tracking-tighter shadow-lg shadow-cyan-500/20">
            SP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-zinc-100 text-sm">SPECTRA</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-cyan-500/20">
                v1.0 MVP
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 block font-medium">Autonomous Black-Box Testing</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === "dashboard"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab("live")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === "live"
                ? "bg-zinc-800 text-cyan-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Live Run
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setCurrentTab("graph")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === "graph"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            State Graph
          </button>
          <button
            onClick={() => setCurrentTab("report")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === "report"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Report
          </button>
          <button
            onClick={() => setCurrentTab("replay")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === "replay"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Replay
          </button>
        </nav>
      </div>

      {/* Model & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Model info */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>gemini-3.8-flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Action Safety Policy Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safety Policy Active</span>
        </div>

        {/* Demo Target link */}
        <a
          href="/demo-app"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
        >
          <span>Demo Target</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* New Audit Button */}
        <button
          onClick={onOpenNewModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Audit</span>
        </button>
      </div>
    </header>
  );
};
