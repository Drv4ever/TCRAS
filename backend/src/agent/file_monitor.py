import os
import time
import hashlib
import requests
import socket
import logging
from watchdog.events import FileSystemEventHandler
from datetime import datetime
try:
    from src.server.core.config import settings
except ImportError:
    # Fallback if run standalone without src package context
    # But for this task we assume integrated environment
    print("Warning: Could not import settings. Using defaults.")
    class MockSettings:
        def get_server_url(self): return "http://localhost:8000"
        def get_api_key(self): return ""
    settings = MockSettings()

logger = logging.getLogger("TCRAS_Agent")

# SERVER_URL is now dynamic
# SERVER_URL = "http://localhost:8000/api/file-event"

def get_file_hash(filepath):
    """Calculate SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        logger.error(f"Error hashing file {filepath}: {e}")
        return "error_calculating_hash"

def get_ip_address():
    try:
        hostname = socket.gethostname()
        return socket.gethostbyname(hostname)
    except:
        return "127.0.0.1"

class RiskMonitorHandler(FileSystemEventHandler):
    def __init__(self):
        self.source_ip = get_ip_address()
        self.user = os.getlogin()

    def process(self, event):
        if event.is_directory:
            return

        filename = os.path.basename(event.src_path)
        # Ignore temp files or hidden files
        if filename.startswith(".") or filename.startswith("~"):
            return

        # Simple debounce or wait for file write to complete
        time.sleep(0.5) 

        file_hash = get_file_hash(event.src_path)
        try:
            file_size = os.path.getsize(event.src_path)
        except OSError:
            file_size = 0

        payload = {
            "filename": filename,
            "file_hash": file_hash,
            "file_size_bytes": file_size,
            "source_ip": self.source_ip,
            "destination_ip": "Unknown", # In a real LAN monitor, this is hard to guess without network sniffing
            "source_user": self.user,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event.event_type
        }

        try:
            logger.info(f"Sending event: {payload}")
            url = f"{settings.get_server_url()}/api/file-event"
            headers = {"X-API-Key": settings.get_api_key()}
            
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                data = response.json()
                # Server returns {"risk": [score, level, details]}
                risk_info = data.get('risk', [])
                if isinstance(risk_info, list) and len(risk_info) >= 2:
                    score, level = risk_info[0], risk_info[1]
                    if level == 'HIGH':
                        print(f"!!! ALARM: HIGH RISK DETECTED !!! Score: {score}")
        except Exception as e:
            logger.error(f"Failed to send event to server: {e}")

    def on_created(self, event):
        self.process(event)

    def on_modified(self, event):
        # Modification can be spammy, maybe filter
        pass 

    def on_moved(self, event):
        # Handle rename/move
        pass
