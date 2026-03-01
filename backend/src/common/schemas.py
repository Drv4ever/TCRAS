from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileEvent(BaseModel):
    """
    Schema representing a file transfer event captured by the Agent.
    """
    filename: str
    file_hash: str
    file_size_bytes: int
    source_ip: str
    destination_ip: Optional[str] = "Unknown"
    source_user: str
    timestamp: datetime
    event_type: str  # created, modified, moved, deleted

class RiskAnalysis(BaseModel):
    """
    Schema for the risk analysis result returned by the Server.
    """
    risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH
    details: str
    timestamp: datetime

class TransferChainNode(BaseModel):
    """
    Represents a node in the transfer chain graph.
    """
    ip_address: str
    user: str

class ChainEvent(BaseModel):
    """
    Aggregated event for dashboard visualization.
    """
    event_id: int
    file_event: FileEvent
    risk_analysis: RiskAnalysis
