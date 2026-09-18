import React, { useState } from "react";
import { Globe, Target, ArrowRight, Play, AlertCircle, History, Clock, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { AuditRunSummary } from "../types";

interface NewAuditViewProps {
  onStartAudit: (url: string, goal: string, isDemo?: boolean) => Promise<void>;
  onSelectAudit: (id: string) => void;
  recentAudits: AuditRunSummary[];
  isStarting: boolean;
  errorMessage: string | null;
}

export const NewAuditView: React.FC<NewAuditViewProps> = ({
  onStartAudit,
  onSelectAudit,
  recentAudits,
  isStarting,
  errorMessage,
}) => {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanUrl = url.trim();
    const cleanGoal = goal.trim();

    if (!cleanUrl) {
      setValidationError("Please enter a target website URL.");
      return;
    }
    if (!cleanGoal) {
      setValidationError("Please describe what user goal SPECTRA should test.");
      return;
    }

    onStartAudit(cleanUrl, cleanGoal, false);
  };

  const handleLaunchDemo = () => {
    onStartAudit("http://localhost:3000/demo-app", "Explore ApexAthletics store and test blue running shoe checkout flow as guest", true);
  };

  const handleSelectPreset = (presetUrl: string, presetGoal: string) => {
    setUrl(presetUrl);
    setGoal(presetGoal);
    setValidationError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Brand Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          Autonomous UI/UX & Accessibility Testing
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100">
          SPECTRA
        </h1>
        <p className="mt-3 text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Give SPECTRA a website and a user goal. It will autonomously explore the interface, navigate real pages, and identify UX and accessibility issues.
        </p>
      </div>

      {/* Error Alert */}
      {(errorMessage || validationError) && (
        <div className="mb-8 p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-snug">
            <span className="font-semibold block text-red-300 mb-0.5">Audit Issue</span>
            {errorMessage || validationError}
          </div>
        </div>
      )}

      {/* Main Audit Form Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target URL */}
          <div>
            <label className="block text-sm font-semibold text-zinc-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                Target Website URL
              </span>
              <span className="text-xs text-zinc-400 font-normal">Any public URL or web application</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://news.ycombinator.com or https://example.com"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3.5 text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono"
                disabled={isStarting}
              />
            </div>
          </div>

          {/* User Goal */}
          <div>
            <label className="block text-sm font-semibold text-zinc-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Natural-Language User Goal
              </span>
              <span className="text-xs text-zinc-400 font-normal">What task should the AI attempt?</span>
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="e.g. Locate search input, search for technology stories, and inspect the navigation layout"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent leading-relaxed"
              disabled={isStarting}
            />
          </div>

          {/* Quick Presets for Convenient Testing */}
          <div className="pt-1">
            <span className="text-xs text-zinc-400 block mb-2 font-medium">Quick benchmark presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset("https://www.amazon.in", "Find a yellow dress in size M under ₹3000")}
                className="text-xs bg-zinc-800/80 hover:bg-zinc-800 text-amber-300 border border-amber-800/40 rounded-lg px-3 py-1.5 transition-colors text-left font-medium"
              >
                Amazon &bull; Find a yellow dress in size M under ₹3000
              </button>
              <button
                type="button"
                onClick={handleLaunchDemo}
                className="text-xs bg-zinc-800/80 hover:bg-zinc-800 text-sky-300 border border-sky-800/40 rounded-lg px-3 py-1.5 transition-colors text-left font-medium"
              >
                ApexAthletics &bull; E-commerce guest checkout flow (Fixture)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("https://news.ycombinator.com", "Browse top stories, search for AI news, and test comment navigation")}
                className="text-xs bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-lg px-3 py-1.5 transition-colors text-left"
              >
                Hacker News &bull; Search & explore stories
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("https://en.wikipedia.org", "Find today's featured article and check sidebar accessibility")}
                className="text-xs bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-lg px-3 py-1.5 transition-colors text-left"
              >
                Wikipedia &bull; Search & sidebar layout
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("https://example.com", "Examine page semantics, link destinations, and contrast")}
                className="text-xs bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-lg px-3 py-1.5 transition-colors text-left"
              >
                Example Domain &bull; Rapid baseline audit
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80">
            {/* Try Demo Option */}
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={isStarting}
              className="w-full sm:w-auto text-xs text-zinc-400 hover:text-sky-300 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or <strong>Try Demo</strong> (bundled ApexAthletics fixture)</span>
            </button>

            {/* Primary Start Button */}
            <button
              type="submit"
              disabled={isStarting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Starting Autonomous Audit...</span>
                </>
              ) : (
                <>
                  <span>Start Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Audits Section */}
      {recentAudits.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" />
              Recent Audits
            </h2>
            <span className="text-xs text-zinc-400">{recentAudits.length} recorded</span>
          </div>

          <div className="space-y-3">
            {recentAudits.map((audit) => {
              const isGoalDone = audit.status === "GOAL_REACHED" || audit.status === "COMPLETED";
              const isFailed = audit.status === "UNEXPECTED_STATE" || audit.status === "BLOCKED";
              const isRunning = audit.status === "RUNNING";

              return (
                <div
                  key={audit.id}
                  onClick={() => onSelectAudit(audit.id)}
                  className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-sky-400 font-medium truncate max-w-xs sm:max-w-sm">
                        {audit.goal.entry_url}
                      </span>
                      {audit.is_demo && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                          DEMO
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isGoalDone ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                        isFailed ? "bg-red-950 text-red-300 border border-red-800" :
                        isRunning ? "bg-sky-950 text-sky-300 border border-sky-800 animate-pulse" :
                        "bg-zinc-800 text-zinc-300"
                      }`}>
                        {audit.status}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-200 line-clamp-1">
                      {audit.goal.raw_goal}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 flex-shrink-0">
                    <div>
                      <span className="text-zinc-200 font-semibold">{audit.step_count}</span> steps
                    </div>
                    <div>
                      <span className="text-zinc-200 font-semibold">{audit.findings_count}</span> findings
                    </div>
                    <div>
                      <span className="text-zinc-200 font-semibold">{audit.duration_sec}s</span>
                    </div>
                    <div className="text-zinc-400 group-hover:text-zinc-200 font-medium flex items-center gap-1 pl-2">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
