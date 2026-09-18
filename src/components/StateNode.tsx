import React from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle2, AlertTriangle, RefreshCw, Slash, Globe } from "lucide-react";
import { StateMachineState } from "../types";

interface StateNodeData {
  label: string;
  url: string;
  status: StateMachineState;
  step_number: number;
  visit_count: number;
  summary: string;
  screenshot_svg?: string;
}

export const StateNode: React.FC<{ data: StateNodeData }> = ({ data }) => {
  const getStatusStyle = (status: StateMachineState) => {
    switch (status) {
      case "GOAL_REACHED":
        return {
          border: "border-emerald-500",
          bg: "bg-emerald-950/40",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          tag: "GOAL REACHED"
        };
      case "LOOP_DETECTED":
        return {
          border: "border-amber-500",
          bg: "bg-amber-950/40",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-400" />,
          tag: "LOOP DETECTED"
        };
      case "DEAD_END":
        return {
          border: "border-rose-500",
          bg: "bg-rose-950/40",
          badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: <Slash className="w-3.5 h-3.5 text-rose-400" />,
          tag: "DEAD END"
        };
      case "BLOCKED":
        return {
          border: "border-purple-500",
          bg: "bg-purple-950/40",
          badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />,
          tag: "SAFETY BLOCKED"
        };
      default:
        return {
          border: "border-zinc-700",
          bg: "bg-zinc-900",
          badgeBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
          icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />,
          tag: "NORMAL"
        };
    }
  };

  const style = getStatusStyle(data.status);

  return (
    <div
      className={`w-64 rounded-lg border ${style.border} ${style.bg} p-3 shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer text-left`}
    >
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2 !h-2" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            Step {data.step_number}
          </span>
          {data.visit_count > 1 && (
            <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50">
              {data.visit_count}x
            </span>
          )}
        </div>
        <span
          className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${style.badgeBg}`}
        >
          {style.icon}
          {style.tag}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-zinc-100 truncate mb-1">
        {data.label}
      </h4>

      {/* URL */}
      <div className="text-[10px] text-zinc-400 font-mono truncate mb-2">
        {data.url}
      </div>

      {/* Mini Viewport thumbnail */}
      {data.screenshot_svg && (
        <div
          className="w-full h-16 rounded border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center opacity-80"
          dangerouslySetInnerHTML={{ __html: data.screenshot_svg }}
        />
      )}

      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-2 !h-2" />
    </div>
  );
};
