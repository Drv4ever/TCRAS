import time
import logging
import os
import sys
from watchdog.observers import Observer
from src.agent.file_monitor import RiskMonitorHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TCRAS_Agent_Service")

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    
    # If path is just a name, create it in current dir
    if not os.path.isabs(path):
        path = os.path.abspath(path)

    os.makedirs(path, exist_ok=True)

    event_handler = RiskMonitorHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    
    observer.start()
    logger.info(f"TCRAS Agent started. Monitoring directory: {path}")
    logger.info("Press Ctrl+C to stop.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    
    observer.join()

if __name__ == "__main__":
    main()
