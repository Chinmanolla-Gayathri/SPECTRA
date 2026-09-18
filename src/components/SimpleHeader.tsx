import React from "react";
import { Plus, Activity, FileCheck, Compass, BookmarkCheck } from "lucide-react";

interface SimpleHeaderProps {
  currentView: "new" | "live" | "results" | "regression";
  setCurrentView: (view: "new" | "live" | "results" | "regression") => void;
  isRunning: boolean;
  hasActiveAudit: boolean;
  onNewAuditClick: () => void;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  currentView,
  setCurrentView,
  isRunning,
  hasActiveAudit,
  onNewAuditClick,
}) => {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800/90 px-4 sm:px-6 py-3.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onNewAuditClick}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-zinc-950 text-sm tracking-tight shadow-md shadow-sky-500/20">
            SP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-zinc-100 text-sm">SPECTRA</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-sky-400 border border-sky-500/20">
                v1.0
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:block font-medium">Autonomous UI/UX Testing</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setCurrentView("new")}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              currentView === "new"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>New Audit</span>
          </button>

          <button
            onClick={() => setCurrentView("live")}
            disabled={!hasActiveAudit}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              currentView === "live"
                ? "bg-zinc-800 text-sky-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`}></span>
            <span>Live Audit</span>
          </button>

          <button
            onClick={() => setCurrentView("results")}
            disabled={!hasActiveAudit}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              currentView === "results"
                ? "bg-zinc-800 text-emerald-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Audit Results</span>
          </button>

          <button
            onClick={() => setCurrentView("regression")}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              currentView === "regression"
                ? "bg-zinc-800 text-sky-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Regression Suite</span>
          </button>
        </nav>

        {/* New Audit Action */}
        <button
          onClick={onNewAuditClick}
          className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Start Audit</span>
        </button>
      </div>
    </header>
  );
};
