
import time
import sys
import os
import logging
from watchdog.observers import Observer

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agent.file_monitor import RiskMonitorHandler

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

if __name__ == "__main__":
    try:
        from src.server.core.config import settings
        monitored_path = settings.get_agent_watch_dir()
    except Exception as e:
        print(f"Error loading config: {e}")
        # Fallback
        monitored_path = os.path.join(os.getcwd(), "monitored_files")

    os.makedirs(monitored_path, exist_ok=True)
    
    print(f"TCRAS Agent Active. Monitoring: {monitored_path}")
    print("Press Ctrl+C to stop.")
    
    event_handler = RiskMonitorHandler()
    observer = Observer()
    observer.schedule(event_handler, monitored_path, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
