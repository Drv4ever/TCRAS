from sqlalchemy import Column, Integer, String, Float, DateTime
from .database import Base
from datetime import datetime

class EventLog(Base):
    __tablename__ = "event_logs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_hash = Column(String, index=True)
    file_size_bytes = Column(Integer)
    source_ip = Column(String)
    destination_ip = Column(String)
    source_user = Column(String)
    event_type = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Risk Analysis Data stored in same table for simplicity or could be separate
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="LOW")
    risk_details = Column(String, default="")

class RiskSummary(Base):
    __tablename__ = "risk_summary"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_events = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    avg_risk = Column(Float, default=0.0)

class GraphSnapshot(Base):
    __tablename__ = "graph_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    node_count = Column(Integer)
    edge_count = Column(Integer)
    json_graph = Column(String) 

class HighRiskLog(Base):
    __tablename__ = "high_risk_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_ip = Column(String, index=True)
    filename = Column(String)
    risk_score = Column(Float)
    risk_reason = Column(String)

class DeviceRiskSummary(Base):
    __tablename__ = "device_risk_summary"
    
    ip_address = Column(String, primary_key=True, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow)
    current_risk_score = Column(Float, default=0.0)
    total_events = Column(Integer, default=0)
    high_risk_events = Column(Integer, default=0)

