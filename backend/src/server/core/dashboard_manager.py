
import logging

logger = logging.getLogger(__name__)

class DashboardManager:
    def __init__(self):
        self.latest_events = []
        self.MAX_EVENTS = 50

    def push_to_ui(self, event_data: dict, risk_data: tuple):
        """
        Stores event for the UI to poll. 
        risk_data is (score, level, details)
        """
        combined = {
            "event": event_data,
            "risk": {
                "score": risk_data[0],
                "level": risk_data[1],
                "details": risk_data[2]
            }
        }
        self.latest_events.insert(0, combined)
        if len(self.latest_events) > self.MAX_EVENTS:
            self.latest_events.pop()
        
        logger.info(f"Dashboard updated. Total events: {len(self.latest_events)}")

dashboard_manager = DashboardManager()
