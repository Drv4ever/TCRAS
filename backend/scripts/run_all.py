
import subprocess
import time
import webbrowser
import sys
import os

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_all():
    print("=======================================")
    print("   TCRAS - Security System Launcher    ")
    print("=======================================")
    
    # Verify Config
    try:
        from src.server.core.config import settings
        print(f"[*] Loaded config successfully: {settings.get_server_host()}:{settings.get_server_port()}")
        
        # Verify Agent Directory
        watch_dir = settings.get_agent_watch_dir()
        if not os.path.exists(watch_dir):
            print(f"[*] Creating monitored directory: {watch_dir}")
            os.makedirs(watch_dir, exist_ok=True)
        else:
            print(f"[*] Verified monitored directory exists: {watch_dir}")

    except Exception as e:
        print(f"[!] Failed to load config: {e}")
        return

    print("🚀 Initializing TCRAS System...")
    
    # Paths
    base_dir = os.getcwd()
    run_server = os.path.join(base_dir, "scripts", "run_server.py")
    run_agent = os.path.join(base_dir, "scripts", "run_agent.py")
    run_app = os.path.join(base_dir, "src", "transfer_app", "main.py")

    # 1. Start Server
    print("Starting Server...")
    server_process = subprocess.Popen([sys.executable, run_server], creationflags=subprocess.CREATE_NEW_CONSOLE)
    time.sleep(3) # Wait for server boot

    # 2. Start Agent
    print("Starting Agent...")
    agent_process = subprocess.Popen([sys.executable, run_agent], creationflags=subprocess.CREATE_NEW_CONSOLE)

    # 3. Open Dashboard
    print("Opening Dashboard...")
    webbrowser.open("http://localhost:8000")

    # 4. Start Transfer App
    print("Launching Transfer App...")
    subprocess.Popen([sys.executable, run_app])

    print("\n✅ System Running. Check the separate console windows for logs.")
    print("Close the consoles to stop the system.")

if __name__ == "__main__":
    run_all()
