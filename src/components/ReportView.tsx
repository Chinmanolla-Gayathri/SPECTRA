import React from "react";
import {
  Download,
  FileCode,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  MousePointer,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { FullAuditRun, FindingCategory, SeverityLevel } from "../types";

interface ReportViewProps {
  auditRun: FullAuditRun | null;
  onLaunchReplay: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ auditRun, onLaunchReplay }) => {
  if (!auditRun) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
        <AlertCircle className="w-12 h-12 text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-300">No Audit Run Selected</h3>
        <p className="text-xs text-zinc-500">Run an audit to view the comprehensive evidence-backed report.</p>
      </div>
    );
  }

  const friction = auditRun.friction_metrics || {
    interaction_cost: 0,
    temporal_cost: 0,
    navigation_cost: 0,
    accessibility_cost: 0,
    spectra_friction_index: 0,
    click_count: 0,
    scroll_count: 0,
    input_count: 0,
    total_duration_sec: 0,
    backtrack_count: 0,
    dead_end_count: 0,
    wcag_violations_count: 0
  };

  const chartData = [
    { name: "Interaction", value: friction.interaction_cost, max: 30, color: "#38bdf8" },
    { name: "Temporal", value: friction.temporal_cost, max: 25, color: "#818cf8" },
    { name: "Navigation", value: friction.navigation_cost, max: 25, color: "#fb7185" },
    { name: "Accessibility", value: friction.accessibility_cost, max: 20, color: "#facc15" }
  ];

  const handleDownloadHtml = () => {
    window.open(`/api/audits/${auditRun.id}/report/html`, "_blank");
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditRun, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `spectra_audit_${auditRun.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] bg-zinc-950 overflow-y-auto">
      {/* Top Action Header */}
      <div className="px-8 py-4 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700 uppercase tracking-wider">
              {auditRun.id}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {auditRun.status}
            </span>
          </div>
          <h1 className="text-lg font-bold text-zinc-100 mt-1">
            {auditRun.goal.raw_goal}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLaunchReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
          >
            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
            Replay Run
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
          >
            <FileCode className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download HTML Report
          </button>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* SPECTRA Friction Index Gauge */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
              SPECTRA Friction Index
            </span>
            <div className="my-2">
              <div className="text-4xl font-extrabold text-cyan-400 tracking-tight">
                {friction.spectra_friction_index}
                <span className="text-lg text-zinc-500 font-normal"> / 100</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {friction.spectra_friction_index < 35 ? "Low Friction Path" : friction.spectra_friction_index < 60 ? "Moderate Obstacles" : "High Cognitive Friction"}
              </p>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, friction.spectra_friction_index)}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
              Execution Duration
            </span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-zinc-100">
                {friction.total_duration_sec}s
              </span>
              <Clock className="w-4 h-4 text-zinc-500" />
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Average step latency: 310ms
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
              Autonomous Actions
            </span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-zinc-100">
                {auditRun.current_step}
              </span>
              <span className="text-xs text-zinc-400">steps taken</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {friction.click_count} clicks • {friction.scroll_count} scrolls • {friction.input_count} inputs
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
              Violations & Defects
            </span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-amber-400">
                {auditRun.findings.length}
              </span>
              <span className="text-xs text-zinc-400">grounded items</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {auditRun.findings.filter(f => f.category === "DETERMINISTIC").length} WCAG A11y • {auditRun.findings.filter(f => f.category !== "DETERMINISTIC").length} UX Friction
            </span>
          </div>
        </div>

        {/* Friction Cost Breakdown Chart */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
                Friction Cost Component Breakdown
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Formula: Interaction (Max 30) + Temporal (Max 25) + Navigation (Max 25) + Accessibility (Max 20)
              </p>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" domain={[0, 30]} stroke="#52525b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step-by-Step Visual Timeline */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Autonomous Path Timeline & State Evidence</span>
          </h3>

          <div className="space-y-4">
            {auditRun.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start"
              >
                {/* Visual Thumbnail */}
                <div className="w-full md:w-64 aspect-[16/10] rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shrink-0 flex items-center justify-center">
                  {step.screenshot_data_url ? (
                    <img src={step.screenshot_data_url} alt={`Step ${step.step_number}`} className="w-full h-full object-contain" />
                  ) : (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: step.screenshot_svg || "" }}
                    />
                  )}
                </div>

                {/* Step Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Step {step.step_number}
                      </span>
                      <span className="font-mono text-xs text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 uppercase">
                        {step.action_type}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{step.latency_ms}ms</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-200">
                    {step.semantic_target}
                  </h4>

                  <div className="text-xs text-zinc-400 font-mono break-all">
                    {step.url}
                  </div>

                  <p className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded border border-zinc-800 leading-relaxed">
                    {step.reasoning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence-Backed Findings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Grounded Findings & WCAG Violations</span>
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              Categorized by Evidence Origin
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditRun.findings.map((finding, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        finding.category === "DETERMINISTIC"
                          ? "bg-blue-950 text-blue-300 border border-blue-800"
                          : finding.category === "OBSERVED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-purple-950 text-purple-300 border border-purple-800"
                      }`}>
                        {finding.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        {finding.severity}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Step {finding.step_number} • Conf: {Math.round(finding.confidence * 100)}%
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-100 mb-1">
                    {finding.title}
                  </h4>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    {finding.description}
                  </p>
                </div>

                <div className="bg-zinc-950 border-l-2 border-cyan-400 p-3 rounded text-xs space-y-1">
                  <span className="text-cyan-400 font-bold block text-[11px] font-mono">REMEDIATION GUIDANCE</span>
                  <p className="text-zinc-300">{finding.recommendation}</p>
                  {finding.dom_selector && (
                    <div className="text-[10px] font-mono text-zinc-500 pt-1">
                      Selector: <code>{finding.dom_selector}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
