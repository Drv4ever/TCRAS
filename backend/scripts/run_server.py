
import uvicorn
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

if __name__ == "__main__":
    from src.server.core.config import settings
    print("Starting TCRAS Server on http://localhost:8000")
    uvicorn.run("src.server.main:app", host=settings.get_server_host(), port=settings.get_server_port(), reload=True)
