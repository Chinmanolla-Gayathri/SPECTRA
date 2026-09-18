"""
SPECTRA - NetworkX State Graph & React Flow Adapter
Maintains directed multi-graph of UI states, action transitions, and friction attributes.
"""
from typing import Dict, Any, List, Optional
from ..models.state import ObservationState
from ..ai.schemas import ActionDecision

class StateGraph:
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, Any]] = []
        self._visited_counts: Dict[str, int] = {}

    def add_state(self, state: ObservationState) -> None:
        self._visited_counts[state.state_id] = self._visited_counts.get(state.state_id, 0) + 1
        if state.state_id not in self.nodes:
            self.nodes[state.state_id] = {
                "id": state.state_id,
                "url": state.url,
                "title": state.title,
                "step_number": state.step_number,
                "status": state.status,
                "visit_count": self._visited_counts[state.state_id],
                "screenshot_path": state.screenshot_path,
                "view_summary": state.view_summary
            }
        else:
            self.nodes[state.state_id]["visit_count"] = self._visited_counts[state.state_id]
            if state.status != "NORMAL":
                self.nodes[state.state_id]["status"] = state.status

    def add_transition(self, from_id: str, to_id: str, action: ActionDecision, friction_cost: float = 1.0) -> None:
        edge_id = f"e_{from_id}_{to_id}_{len(self.edges)}"
        self.edges.append({
            "id": edge_id,
            "source": from_id,
            "target": to_id,
            "action_type": action.action_type,
            "label": f"{action.action_type}: {action.semantic_target[:24]}",
            "semantic_target": action.semantic_target,
            "confidence": action.confidence,
            "friction_cost": friction_cost
        })

    def get_visit_count(self, state_id: str) -> int:
        return self._visited_counts.get(state_id, 0)

    def to_react_flow(self) -> Dict[str, Any]:
        """Converts graph into React Flow compatible nodes & edges format."""
        rf_nodes = []
        rf_edges = []
        
        # Position nodes in an organized hierarchical grid
        col_x = 0
        row_y = 100
        step_cols: Dict[int, int] = {}

        for n_id, n_data in self.nodes.items():
            step = n_data.get("step_number", 0)
            step_cols[step] = step_cols.get(step, 0) + 1
            pos_x = 100 + step * 280
            pos_y = 80 + (step_cols[step] - 1) * 160

            rf_nodes.append({
                "id": n_id,
                "type": "spectraStateNode",
                "position": {"x": pos_x, "y": pos_y},
                "data": {
                    "label": n_data.get("title", "State"),
                    "url": n_data.get("url", ""),
                    "status": n_data.get("status", "NORMAL"),
                    "step_number": step,
                    "visit_count": n_data.get("visit_count", 1),
                    "summary": n_data.get("view_summary", "")
                }
            })

        for edge in self.edges:
            rf_edges.append({
                "id": edge["id"],
                "source": edge["source"],
                "target": edge["target"],
                "animated": True,
                "label": edge["label"],
                "data": {
                    "friction_cost": edge.get("friction_cost", 1.0),
                    "action_type": edge.get("action_type", "click")
                }
            })

        return {"nodes": rf_nodes, "edges": rf_edges}
