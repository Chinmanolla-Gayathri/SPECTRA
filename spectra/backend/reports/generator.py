"""
SPECTRA - Report Generator
Generates structured JSON and self-contained static HTML visual audit reports.
"""
import json
from typing import Dict, Any

class ReportGenerator:
    def __init__(self):
        pass

    def generate_json(self, run_data: Dict[str, Any]) -> str:
        return json.dumps(run_data, indent=2)

    def generate_html(self, run_data: Dict[str, Any]) -> str:
        run_id = run_data.get("run_id", "SPECTRA-RUN")
        goal = run_data.get("goal", {})
        friction = run_data.get("friction_metrics", {})
        findings = run_data.get("findings", [])
        steps = run_data.get("steps", [])

        findings_html = ""
        for f in findings:
            cat_badge = f"""<span class="badge badge-{f.get('category', 'OBSERVED').lower()}">{f.get('category')}</span>"""
            sev_badge = f"""<span class="badge badge-{f.get('severity', 'LOW').lower()}">{f.get('severity')}</span>"""
            findings_html += f"""
            <div class="card finding-card">
              <div class="card-header">
                <div>{cat_badge} {sev_badge}</div>
                <span class="confidence">Conf: {int(f.get('confidence', 1.0) * 100)}%</span>
              </div>
              <h3>{f.get('title')}</h3>
              <p class="desc">{f.get('description')}</p>
              <div class="remediation">
                <strong>Remediation:</strong> {f.get('recommendation')}
              </div>
              <div class="meta">Step {f.get('step_number')} | Selector: <code>{f.get('dom_selector', 'N/A')}</code></div>
            </div>
            """

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SPECTRA Audit Report - {run_id}</title>
  <style>
    :root {{
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --accent: #38bdf8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 32px;
      line-height: 1.5;
    }}
    .container {{ max-width: 1100px; margin: 0 auto; }}
    .header {{ border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 32px; }}
    .logo {{ font-size: 24px; font-weight: 800; letter-spacing: 2px; color: var(--accent); }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 24px 0; }}
    .metric-box {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center; }}
    .metric-value {{ font-size: 36px; font-weight: 700; color: var(--accent); }}
    .metric-label {{ font-size: 12px; text-transform: uppercase; color: var(--muted); margin-top: 4px; }}
    .card {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 16px; }}
    .badge {{ display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-right: 6px; }}
    .badge-deterministic {{ background: #1e3a8a; color: #93c5fd; }}
    .badge-observed {{ background: #14532d; color: #86efac; }}
    .badge-ai_inferred {{ background: #581c87; color: #d8b4fe; }}
    .badge-critical {{ background: #7f1d1d; color: #fca5a5; }}
    .badge-high {{ background: #9a3412; color: #fdba74; }}
    .badge-medium {{ background: #78350f; color: #fde68a; }}
    .remediation {{ background: #1e293b; border-left: 3px solid var(--accent); padding: 12px; margin: 12px 0; font-size: 13px; }}
    code {{ background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 12px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SPECTRA // AUDIT REPORT</div>
      <p class="desc">Autonomous Black-Box UI/UX & Accessibility Execution Evidence</p>
      <div><strong>Goal:</strong> {goal.get('raw_goal', 'N/A')}</div>
      <div><strong>Entry URL:</strong> <code>{goal.get('entry_url', 'N/A')}</code></div>
    </div>

    <div class="grid">
      <div class="metric-box">
        <div class="metric-value">{friction.get('spectra_friction_index', 0.0)}</div>
        <div class="metric-label">SPECTRA Friction Index</div>
      </div>
      <div class="metric-box">
        <div class="metric-value">{friction.get('click_count', 0)}</div>
        <div class="metric-label">Total Clicks</div>
      </div>
      <div class="metric-box">
        <div class="metric-value">{friction.get('total_duration_sec', 0.0)}s</div>
        <div class="metric-label">Execution Time</div>
      </div>
      <div class="metric-box">
        <div class="metric-value">{len(findings)}</div>
        <div class="metric-label">Detected Findings</div>
      </div>
    </div>

    <h2>Audit Findings & Grounded Evidence</h2>
    <div class="findings-list">
      {findings_html}
    </div>
  </div>
</body>
</html>
"""
        return html
