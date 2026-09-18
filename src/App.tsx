import React, { useState, useEffect, useRef } from "react";
import { SimpleHeader } from "./components/SimpleHeader";
import { NewAuditView } from "./components/NewAuditView";
import { LiveAuditView } from "./components/LiveAuditView";
import { AuditResultsView } from "./components/AuditResultsView";
import { RegressionSuiteView } from "./components/RegressionSuiteView";
import { StateGraphModal } from "./components/StateGraphModal";
import { EvidenceModal } from "./components/EvidenceModal";
import { AuditRunSummary, FullAuditRun, UXFinding, StepRecord } from "./types";

export default function App() {
  // 4 Primary Views: "new" (default), "live", "results", "regression"
  const [currentView, setCurrentView] = useState<"new" | "live" | "results" | "regression">("new");

  const [runs, setRuns] = useState<AuditRunSummary[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<FullAuditRun | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Progressive Disclosure Modals
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [inspectedFinding, setInspectedFinding] = useState<UXFinding | null>(null);
  const [inspectedStep, setInspectedStep] = useState<StepRecord | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch list of recent audits
  const fetchRuns = async () => {
    try {
      const res = await fetch("/api/audits");
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (e) {
      console.error("Failed to fetch audits:", e);
    }
  };

  // Fetch full details of an active audit
  const fetchActiveRun = async (id: string) => {
    try {
      const res = await fetch(`/api/audits/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveRun(data);
        if (data.error_message) {
          setErrorMessage(data.error_message);
        }
      }
    } catch (e) {
      console.error("Failed to fetch active run:", e);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 5000);
    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // Connect to SSE stream for real-time telemetry
  const connectSSE = (runId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/audits/${runId}/events`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "INITIAL_SYNC") {
          fetchActiveRun(runId);
        } else if (data.type === "STEP_PROGRESS") {
          setActiveRun((prev) => {
            if (!prev || prev.id !== runId) return prev;

            const newStep: StepRecord = {
              step_number: data.step,
              timestamp: Date.now(),
              url: data.url,
              page_title: data.page_title,
              state_id: data.state_id,
              status: data.status,
              action_type: data.action.type,
              semantic_target: data.action.target,
              observed: data.action.observed,
              reasoning: data.action.reasoning,
              latency_ms: data.latency_ms,
              screenshot_data_url: data.screenshot_data_url,
              screenshot_svg: data.screenshot_svg,
              active_candidates: data.candidates || [],
              findings_in_step: data.new_findings || []
            };

            const existing = prev.steps || [];
            const updated = existing.some(s => s.step_number === data.step)
              ? existing
              : [...existing, newStep];

            return {
              ...prev,
              current_step: data.step,
              status: data.status,
              steps: updated,
              findings: [...(prev.findings || []), ...(data.new_findings || [])],
              graph: data.graph || prev.graph
            };
          });
        } else if (data.type === "RUN_FAILED") {
          setErrorMessage(data.error || "Execution failed");
          fetchActiveRun(runId);
          fetchRuns();
        } else if (data.type === "RUN_COMPLETED" || data.type === "RUN_STOPPED") {
          fetchActiveRun(runId);
          fetchRuns();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    sse.onerror = () => {
      // SSE connection closed or retry
    };
  };

  // Start new audit
  const handleStartAudit = async (url: string, goal: string, isDemo: boolean = false) => {
    setIsStarting(true);
    setErrorMessage(null);

    try {
      let res;
      if (isDemo) {
        res = await fetch("/api/audits/demo", { method: "POST" });
      } else {
        res = await fetch("/api/audits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entry_url: url,
            goal: goal,
            is_demo: false,
            max_steps: 10,
            max_paths: 3
          })
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to create audit (HTTP ${res.status})`);
      }

      const auditData = await res.json();
      const runId = auditData.run_id;

      setActiveRunId(runId);
      await fetchActiveRun(runId);
      connectSSE(runId);
      setCurrentView("live");

      // Start execution
      const startRes = await fetch(`/api/audits/${runId}/start`, { method: "POST" });
      if (!startRes.ok) {
        const errStart = await startRes.json().catch(() => ({}));
        throw new Error(errStart.error || "Failed to start audit runner");
      }

      fetchRuns();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start audit");
    } finally {
      setIsStarting(false);
    }
  };

  // Select an existing audit from the recent list
  const handleSelectAudit = async (id: string) => {
    setActiveRunId(id);
    setErrorMessage(null);
    await fetchActiveRun(id);
    connectSSE(id);

    // If it's currently running, go to live view; otherwise go to results view
    const item = runs.find(r => r.id === id);
    if (item && item.status === "RUNNING") {
      setCurrentView("live");
    } else {
      setCurrentView("results");
    }
  };

  const handlePause = async () => {
    if (!activeRunId) return;
    setIsPaused(true);
    await fetch(`/api/audits/${activeRunId}/pause`, { method: "POST" });
  };

  const handleResume = async () => {
    if (!activeRunId) return;
    setIsPaused(false);
    await fetch(`/api/audits/${activeRunId}/resume`, { method: "POST" });
  };

  const handleStop = async () => {
    if (!activeRunId) return;
    await fetch(`/api/audits/${activeRunId}/stop`, { method: "POST" });
    fetchActiveRun(activeRunId);
    fetchRuns();
  };

  const handleInspectFinding = (finding: UXFinding) => {
    setInspectedFinding(finding);
    setInspectedStep(null);
    setIsEvidenceModalOpen(true);
  };

  const handleInspectStepEvidence = (step: StepRecord) => {
    setInspectedStep(step);
    setInspectedFinding(null);
    setIsEvidenceModalOpen(true);
  };

  const isRunning = activeRun?.status === "RUNNING";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      <SimpleHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        isRunning={isRunning}
        hasActiveAudit={Boolean(activeRun)}
        onNewAuditClick={() => {
          setErrorMessage(null);
          setCurrentView("new");
        }}
      />

      <main className="flex-1 overflow-y-auto">
        {/* VIEW A: New Audit (Default) */}
        {currentView === "new" && (
          <NewAuditView
            onStartAudit={handleStartAudit}
            onSelectAudit={handleSelectAudit}
            recentAudits={runs}
            isStarting={isStarting}
            errorMessage={errorMessage}
          />
        )}

        {/* VIEW B: Live Audit */}
        {currentView === "live" && activeRun && (
          <LiveAuditView
            audit={activeRun}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onViewResults={() => setCurrentView("results")}
            isPaused={isPaused}
          />
        )}

        {/* VIEW C: Audit Results */}
        {currentView === "results" && activeRun && (
          <AuditResultsView
            audit={activeRun}
            onOpenStateGraph={() => setIsGraphModalOpen(true)}
            onOpenEvidence={() => {
              setInspectedFinding(null);
              setInspectedStep(null);
              setIsEvidenceModalOpen(true);
            }}
            onNewAudit={() => {
              setErrorMessage(null);
              setCurrentView("new");
            }}
            onInspectFinding={handleInspectFinding}
            onInspectStep={(stepNumber) => {
              const s = activeRun.steps?.find(st => st.step_number === stepNumber);
              if (s) {
                handleInspectStepEvidence(s);
              }
            }}
            onGoToRegressionSuite={() => setCurrentView("regression")}
          />
        )}

        {/* VIEW D: Regression Suite */}
        {currentView === "regression" && (
          <RegressionSuiteView
            onSelectAudit={handleSelectAudit}
            onNewAuditClick={() => {
              setErrorMessage(null);
              setCurrentView("new");
            }}
          />
        )}
      </main>

      {/* Progressive Disclosure: State Graph Modal */}
      {isGraphModalOpen && activeRun && (
        <StateGraphModal
          audit={activeRun}
          onClose={() => setIsGraphModalOpen(false)}
          onOpenStepEvidence={(step) => {
            handleInspectStepEvidence(step);
          }}
        />
      )}

      {/* Progressive Disclosure: Evidence & Screenshot Modal */}
      {isEvidenceModalOpen && activeRun && (
        <EvidenceModal
          audit={activeRun}
          finding={inspectedFinding}
          step={inspectedStep}
          onClose={() => {
            setIsEvidenceModalOpen(false);
            setInspectedFinding(null);
            setInspectedStep(null);
          }}
        />
      )}
    </div>
  );
}
