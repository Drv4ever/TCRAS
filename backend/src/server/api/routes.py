from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from src.server.db.database import get_db
from src.server.db.models import EventLog
from src.common.schemas import FileEvent, RiskAnalysis
from src.server.core.graph_engine import TransferGraph
from src.server.core.risk_engine import risk_engine
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Global in-memory graph (for prototype simplicity)
# IN A REAL APP, USE REDIS OR DB PERSISTENCE FOR GRAPH
transfer_graph = TransferGraph()

@router.post("/event", response_model=RiskAnalysis)
def receive_event(event: FileEvent, db: Session = Depends(get_db)):
    """
    Endpoint for Agent to send file events.
    Triggers Graph update and AI Risk Analysis.
    """
    logger.info(f"Received event: {event}")

    # 1. Update Graph
    transfer_graph.add_transfer(
        source=event.source_ip,
        destination=event.destination_ip or "Unknown",
        filename=event.filename,
        timestamp=event.timestamp
    )

    # 2. Extract Graph Features
    chain_length = transfer_graph.get_longest_chain()
    is_cycle = transfer_graph.is_cyclic()
    degree = transfer_graph.get_node_degree(event.source_ip)

    # 3. AI Risk Scoring
    score, level, details = risk_engine.calculate_risk(
        file_size=event.file_size_bytes,
        chain_length=chain_length,
        node_degree=degree,
        is_cycle=is_cycle
    )

    # 4. Save to DB
    new_log = EventLog(
        filename=event.filename,
        file_hash=event.file_hash,
        file_size_bytes=event.file_size_bytes,
        source_ip=event.source_ip,
        destination_ip=event.destination_ip,
        source_user=event.source_user,
        event_type=event.event_type,
        timestamp=event.timestamp,
        risk_score=score,
        risk_level=level,
        risk_details=details
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return RiskAnalysis(
        risk_score=score,
        risk_level=level,
        details=details,
        timestamp=event.timestamp
    )

@router.get("/graph-data")
def get_graph_data():
    """
    Returns graph nodes and edges for frontend visualization.
    """
    return transfer_graph.export_graph_data()

@router.get("/recent-events")
def get_recent_events(limit: int = 20, db: Session = Depends(get_db)):
    return db.query(EventLog).order_by(EventLog.timestamp.desc()).limit(limit).all()
