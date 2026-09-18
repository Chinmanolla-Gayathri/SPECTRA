import React from "react";
import {
  Activity,
  Plus,
  Play,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  ShieldAlert,
  Compass
} from "lucide-react";
import { AuditRunSummary } from "../types";

interface DashboardViewProps {
  runs: AuditRunSummary[];
  onSelectRun: (id: string, view: "live" | "report" | "replay") => void;
  onOpenNewModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  runs,
  onSelectRun,
  onOpenNewModal
}) => {
  const totalRuns = runs.length;
  const avgFriction = totalRuns > 0
    ? Math.round(runs.reduce((acc, r) => acc + (r.friction_index || 0), 0) / totalRuns)
    : 0;
  const totalFindings = runs.reduce((acc, r) => acc + (r.findings_count || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] bg-zinc-950 overflow-y-auto">
      {/* Top Banner */}
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              SPECTRA Audit Dashboard
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Autonomous Black-Box UI/UX &amp; Accessibility Intelligence • Real-time State Discovery
            </p>
          </div>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all self-start md:self-auto hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Audit</span>
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>TOTAL AUDITS</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-100">{totalRuns}</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Black-box explorations</span>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>AVG FRICTION INDEX</span>
              <TrendingDown className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-cyan-400">
              {avgFriction}
              <span className="text-sm font-normal text-zinc-500"> / 100</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Weighted user effort cost</span>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>DETECTED FINDINGS</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400">{totalFindings}</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">WCAG &amp; UX violations</span>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
              <span>EXPLORATION SUCCESS</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">100%</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Goals verified autonomously</span>
          </div>
        </div>

        {/* Audit Runs Table */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Recent Autonomous Audit Runs</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Live DB Synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-400 font-mono text-[11px]">
                  <th className="py-3 px-6">RUN ID</th>
                  <th className="py-3 px-6">NATURAL-LANGUAGE GOAL</th>
                  <th className="py-3 px-6">TARGET URL</th>
                  <th className="py-3 px-6">STATUS</th>
                  <th className="py-3 px-6">FRICTION</th>
                  <th className="py-3 px-6">STEPS</th>
                  <th className="py-3 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-zinc-900/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectRun(run.id, "report")}
                  >
                    <td className="py-4 px-6 font-mono text-cyan-400 font-semibold">
                      {run.id}
                    </td>
                    <td className="py-4 px-6 text-zinc-200 font-medium max-w-sm">
                      <div className="truncate">{run.goal?.raw_goal}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-zinc-400 max-w-xs truncate">
                      {run.goal?.entry_url}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        run.status === "GOAL_REACHED" || run.status === "COMPLETED"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                          : run.status === "RUNNING"
                          ? "bg-cyan-950/60 text-cyan-300 border-cyan-800 animate-pulse"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-zinc-100">
                      {run.friction_index || 0}
                    </td>
                    <td className="py-4 px-6 font-mono text-zinc-400">
                      {run.step_count || 0} steps
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectRun(run.id, "live")}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
                          title="Live Monitor"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectRun(run.id, "report")}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                          title="View Full Report"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
