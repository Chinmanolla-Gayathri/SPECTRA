import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StateNode } from "./StateNode";
import { FullAuditRun, StateGraphNode } from "../types";
import { Layers, Info, X } from "lucide-react";

interface StateGraphViewProps {
  auditRun: FullAuditRun | null;
}

const nodeTypes = {
  spectraStateNode: StateNode
};

export const StateGraphView: React.FC<StateGraphViewProps> = ({ auditRun }) => {
  const [selectedNode, setSelectedNode] = useState<StateGraphNode | null>(null);

  const rawNodes = auditRun?.graph?.nodes || [];
  const rawEdges = auditRun?.graph?.edges || [];

  const nodes: Node[] = useMemo(() => {
    return rawNodes.map((n) => ({
      id: n.id,
      type: "spectraStateNode",
      position: n.position,
      data: n.data
    }));
  }, [rawNodes]);

  const edges: Edge[] = useMemo(() => {
    return rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated !== false,
      style: { stroke: "#38bdf8", strokeWidth: 1.5 },
      labelStyle: { fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
      labelBgStyle: { fill: "#18181b", stroke: "#27272a" },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4
    }));
  }, [rawEdges]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const found = rawNodes.find((n) => n.id === node.id);
    if (found) setSelectedNode(found);
  };

  if (!auditRun) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
        <Layers className="w-12 h-12 text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-300">No Active State Graph</h3>
        <p className="text-xs text-zinc-500">Select or trigger an audit to view state graph transitions.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex flex-col h-[calc(100vh-61px)] bg-zinc-950 overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>State Machine & Exploration Graph</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {nodes.length} States discovered • {edges.length} Transitions
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Goal Reached</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-zinc-400">Loop Detected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className="text-zinc-400">Normal</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          className="bg-zinc-950"
        >
          <Background color="#27272a" gap={20} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-zinc-900 !border-zinc-800 !fill-zinc-300" />
          <MiniMap
            className="!bg-zinc-900 !border-zinc-800"
            nodeColor={(node) => {
              if (node.data?.status === "GOAL_REACHED") return "#10b981";
              if (node.data?.status === "LOOP_DETECTED") return "#f59e0b";
              return "#38bdf8";
            }}
          />
        </ReactFlow>
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute right-4 top-14 bottom-4 w-96 bg-zinc-900/95 border border-zinc-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md flex flex-col z-30 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-zinc-100">State Details</h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1 font-mono">
                State Identification
              </span>
              <div className="font-mono text-cyan-400 bg-zinc-950 p-2 rounded border border-zinc-800">
                {selectedNode.id}
              </div>
            </div>

            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1 font-mono">
                Page Title & URL
              </span>
              <div className="font-medium text-zinc-200 mb-1">{selectedNode.data.label}</div>
              <div className="text-zinc-400 font-mono text-[11px] break-all bg-zinc-950 p-2 rounded border border-zinc-800">
                {selectedNode.data.url}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">DISCOVERY STEP</span>
                <span className="font-mono text-zinc-200 font-semibold text-sm">
                  Step {selectedNode.data.step_number}
                </span>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">VISIT COUNT</span>
                <span className="font-mono text-zinc-200 font-semibold text-sm">
                  {selectedNode.data.visit_count} time(s)
                </span>
              </div>
            </div>

            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1 font-mono">
                Perception Summary
              </span>
              <p className="text-zinc-300 bg-zinc-950/60 p-3 rounded border border-zinc-800/80 leading-relaxed">
                {selectedNode.data.summary || "Interactive view captured during autonomous traversal."}
              </p>
            </div>

            {selectedNode.data.screenshot_svg && (
              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] block mb-1 font-mono">
                  State Frame Preview
                </span>
                <div
                  className="w-full h-40 rounded border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: selectedNode.data.screenshot_svg }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
