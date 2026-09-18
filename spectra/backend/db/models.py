"""
SPECTRA - Database Models (SQLAlchemy)
Stores persistent audit runs, steps, findings, and graph snapshots.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class AuditRun(Base):
    __tablename__ = "audit_runs"

    id = Column(String(64), primary_key=True, index=True)
    goal = Column(Text, nullable=False)
    entry_url = Column(String(512), nullable=False)
    status = Column(String(32), default="PENDING")
    friction_index = Column(Float, default=0.0)
    total_steps = Column(Integer, default=0)
    duration_sec = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    report_json = Column(Text, nullable=True)
    state_graph_json = Column(Text, nullable=True)

class AuditFinding(Base):
    __tablename__ = "audit_findings"

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), index=True)
    category = Column(String(32))  # DETERMINISTIC, OBSERVED, AI_INFERRED
    severity = Column(String(32))  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(256))
    description = Column(Text)
    recommendation = Column(Text)
    step_number = Column(Integer)
    dom_selector = Column(String(256), nullable=True)
    confidence = Column(Float, default=1.0)
