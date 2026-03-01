from fastapi import APIRouter, Depends
from pydantic import BaseModel
from src.server.core.graph_engine import graph_engine
from src.server.core.risk_engine import risk_engine
from src.server.core.dashboard_manager import dashboard_manager
from src.server.api.dependencies import verify_api_key

router = APIRouter()

class FileEventSchema(BaseModel):
    filename: str
    file_hash: str
    file_size_bytes: int
    source_ip: str
    destination_ip: str
    source_user: str
    timestamp: str
    event_type: str

class RiskCheckSchema(BaseModel):
    filename: str
    source_ip: str
    destination_ip: str
    file_size_bytes: int

@router.post("/risk/check", dependencies=[Depends(verify_api_key)])
async def check_risk(check: RiskCheckSchema):
    """
    Pre-transfer risk check called by Transfer App.
    """
    # 1. Graph Analysis (Simulated for pre-check based on existing state)
    chain_length = max(1, graph_engine.get_longest_chain())
    # Hypothetically add edge to check cycle
    # We won't actually add it to graph yet, just check.
    # For prototype, we reuse current state + 1
    
    risk_score, level, reason = risk_engine.calculate_risk(
        file_size=check.file_size_bytes,
        chain_length=chain_length,
        node_degree=max(1, graph_engine.get_node_degree(check.source_ip)),
        is_cycle=False # Can't know for sure until transfer
    )
    
    return {
        "score": risk_score,
        "level": level,
        "reason": reason,
        "allowed": level != "HIGH"
    }

@router.post("/file-event", dependencies=[Depends(verify_api_key)])
async def receive_event(event: FileEventSchema):
    # Update Graph
    graph_engine.add_transfer(
        source=event.source_ip,
        destination=event.destination_ip,
        filename=event.filename,
        timestamp=event.timestamp
    )
    
    # Calculate Risk
    # We need to calculate chain length and node degree from graph engine
    chain_length = graph_engine.get_longest_chain()
    # For node degree, we check the source node
    node_degree = graph_engine.get_node_degree(event.source_ip)
    is_cycle = graph_engine.is_cyclic()

    risk = risk_engine.calculate_risk(
        file_size=event.file_size_bytes,
        chain_length=chain_length,
        node_degree=node_degree,
        is_cycle=is_cycle
    )
    
    # Push to Dashboard
    dashboard_manager.push_to_ui(event.dict(), risk)
    
    # Broadcast via SSE
    import json
    from src.server.api.sse import event_hub
    
    payload = {
        "event": event.dict(),
        "risk": {
            "score": risk[0],
            "level": risk[1],
            "details": risk[2]
        }
    }
    await event_hub.publish(json.dumps(payload))
    
    # DB Updates (Background Task ideally, here inline for prototype)
    try:
        from src.server.db.database import SessionLocal
        from src.server.db.models import HighRiskLog, DeviceRiskSummary
        from datetime import datetime
        db = SessionLocal()
        
        # 1. High Risk Log
        if risk[1] == "HIGH":
            hr_log = HighRiskLog(
                source_ip=event.source_ip,
                filename=event.filename,
                risk_score=risk[0],
                risk_reason=risk[2]
            )
            db.add(hr_log)
        
        # 2. Device Summary Update
        device_summary = db.query(DeviceRiskSummary).filter(DeviceRiskSummary.ip_address == event.source_ip).first()
        if not device_summary:
            device_summary = DeviceRiskSummary(ip_address=event.source_ip, total_events=0, high_risk_events=0)
            db.add(device_summary)
        
        device_summary.last_seen = datetime.utcnow()
        device_summary.total_events += 1
        if risk[1] == "HIGH":
            device_summary.high_risk_events += 1
        # Simple moving average for demo
        device_summary.current_risk_score = (device_summary.current_risk_score * 0.9) + (risk[0] * 0.1)
        
        db.commit()
        db.close()
    except Exception as e:
        print(f"DB Update Error: {e}")

    # Persist Snapshot Occasionally
    
    # Persist Snapshot Occasionally
    # In a real production app, use Celery or APScheduler. 
    # Here, we trigger a simple check or probability-based snapshot for prototype simplicity.
    import random
    if random.random() < 0.1: # 10% chance per event to save snapshot
       save_snapshot_to_db(graph_engine.export_graph_data())

    return {"status": "received", "risk": risk}

@router.get("/dashboard-stats")
async def get_dashboard_stats():
    return {
        "events": dashboard_manager.latest_events,
        "graph": graph_engine.export_graph_data()
    }

# Snapshot Helper
def save_snapshot_to_db(graph_data):
    from src.server.db.database import SessionLocal
    from src.server.db.models import GraphSnapshot
    import json
    
    db = SessionLocal()
    try:
        snapshot = GraphSnapshot(
            node_count=len(graph_data['nodes']),
            edge_count=len(graph_data['links']),
            json_graph=json.dumps(graph_data)
        )
        db.add(snapshot)
        db.commit()
    except Exception as e:
        print(f"Snapshot save failed: {e}")
    finally:
        db.close()
