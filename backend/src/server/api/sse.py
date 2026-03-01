import asyncio
import logging
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from src.server.core.dashboard_manager import dashboard_manager
from src.server.api.dependencies import verify_api_key

logger = logging.getLogger(__name__)
router = APIRouter()

async def event_generator(request: Request):
    """
    Generator that yields SSE formatted events.
    In a real system, this would listen to a Redis PubSub or similar.
    Here, we poll the dashboard_manager for updates for simplicity.
    """
    last_sent_index = -1
    
    # Send initial data immediately
    yield f"event: init\ndata: connected\n\n"

    while True:
        if await request.is_disconnected():
            break

        # Check for new events in dashboard_manager
        # We need a way to track what we've sent to THIS specific client.
        # This naive polling is not scalable but works for a prototype.
        
        current_len = len(dashboard_manager.latest_events)
        
        # If we have unsent events (assuming simple append-only log in memory for now)
        # Note: dashboard_manager.latest_events is a list that might be truncated.
        # For a robust SSE, use an Async Queue per client.
        pass 
        
        # Better Approach: Use an asyncio.Queue for this connection
        # We'll use a queue attached to the manager in a later step or just send heartbeats 
        # For now, let's just emit 'ping' to keep alive and rely on the frontend to pull or 
        # we can implement a proper broadcast queue.
        
        yield f"event: ping\ndata: {current_len}\n\n"
        
        await asyncio.sleep(2)

# Global Hub for SSE connections
class SSEHub:
    def __init__(self):
        self.active_connections = set()

    async def broadcast(self, data: str):
        # This is complex to implement with raw generators without queues.
        # We will use the 'Stream' approach where clients wait on a Queue.
        pass

# Simplified Approach: 
# The Dashboard will use the existing /dashboard-stats POLLING for data (Step 4 of previous task).
# The user REQUESTED SSE. So we must implement SSE.
# Let's Implement a Queue-based SSE Hub.

class EventHub:
    def __init__(self):
        self.subscribers = set()
    
    async def subscribe(self):
        queue = asyncio.Queue()
        self.subscribers.add(queue)
        try:
            while True:
                # Wait for data or timeout for heartbeat
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            self.subscribers.remove(queue)
    
    async def publish(self, data: str):
        for queue in self.subscribers:
            await queue.put(data)

event_hub = EventHub()

@router.get("/stream", dependencies=[Depends(verify_api_key)])
async def stream(request: Request):
    return StreamingResponse(event_hub.subscribe(), media_type="text/event-stream")
