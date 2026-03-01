"""
TCRAS Unified Launcher - Web Edition
Starts Python AI Server, Node.js Transfer Server, and React Frontend
"""

import subprocess
import sys
import os
import time
import signal

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

processes = []

def print_banner():
    print(f"\n{Colors.CYAN}{'='*60}")
    print(f"{Colors.BOLD}   TCRAS - Transfer Chain Risk Amplification System")
    print(f"   Web Edition Launcher{Colors.ENDC}")
    print(f"{Colors.CYAN}{'='*60}{Colors.ENDC}\n")

def check_node_installed():
    """Check if Node.js and npm are installed"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            node_version = result.stdout.strip()
            print(f"{Colors.GREEN}✓ Node.js detected: {node_version}{Colors.ENDC}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    print(f"{Colors.FAIL}✗ Node.js is not installed or not in PATH{Colors.ENDC}")
    print(f"\n{Colors.WARNING}To use the React + Node.js upgrade, you need to install Node.js:{Colors.ENDC}")
    print(f"  1. Download from: https://nodejs.org/")
    print(f"  2. Install Node.js 18+ (LTS recommended)")
    print(f"  3. Restart your terminal/command prompt")
    print(f"  4. Run this script again")
    print(f"\n{Colors.CYAN}Alternative: Use the existing Tkinter client:{Colors.ENDC}")
    print(f"  python client_transfer_only.py")
    print(f"  or")
    print(f"  python src/transfer_app/main.py")
    return False

def start_python_server():
    """Start Python FastAPI server"""
    print(f"{Colors.BLUE}[1/3] Starting Python AI Server...{Colors.ENDC}")
    
    try:
        process = subprocess.Popen(
            [sys.executable, "scripts/run_server.py"],
            cwd=os.getcwd(),
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        processes.append(('Python Server', process))
        print(f"{Colors.GREEN}✓ Python Server started (PID: {process.pid}){Colors.ENDC}")
        print(f"  URL: http://localhost:8000\n")
        time.sleep(3)  # Wait for server to initialize
        return True
    except Exception as e:
        print(f"{Colors.FAIL}✗ Failed to start Python server: {e}{Colors.ENDC}")
        return False

def start_node_server():
    """Start Node.js transfer server"""
    print(f"{Colors.BLUE}[2/3] Starting Node.js Transfer Server...{Colors.ENDC}")
    
    node_dir = os.path.join(os.getcwd(), "node-server")
    
    # Check if node_modules exists
    if not os.path.exists(os.path.join(node_dir, "node_modules")):
        print(f"{Colors.WARNING}  Installing Node dependencies (this may take a minute)...{Colors.ENDC}")
        try:
            # Use npm.cmd on Windows for subprocess compatibility
            npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
            install = subprocess.run(
                [npm_cmd, "install"],
                cwd=node_dir,
                capture_output=True,
                text=True,
                timeout=120
            )
            if install.returncode != 0:
                print(f"{Colors.FAIL}✗ npm install failed{Colors.ENDC}")
                print(f"  Error: {install.stderr[:200]}")
                return False
        except subprocess.TimeoutExpired:
            print(f"{Colors.FAIL}✗ npm install timed out{Colors.ENDC}")
            return False
        except Exception as e:
            print(f"{Colors.FAIL}✗ npm install error: {e}{Colors.ENDC}")
            return False
    
    try:
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        process = subprocess.Popen(
            [npm_cmd, "start"],
            cwd=node_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        processes.append(('Node Server', process))
        print(f"{Colors.GREEN}✓ Node Server started (PID: {process.pid}){Colors.ENDC}")
        print(f"  URL: http://localhost:5000\n")
        time.sleep(3)
        return True
    except Exception as e:
        print(f"{Colors.FAIL}✗ Failed to start Node server: {e}{Colors.ENDC}")
        return False

def start_react_client():
    """Start React development server"""
    print(f"{Colors.BLUE}[3/3] Starting React Frontend...{Colors.ENDC}")
    
    react_dir = os.path.join(os.getcwd(), "react-client")
    
    # Check if node_modules exists
    if not os.path.exists(os.path.join(react_dir, "node_modules")):
        print(f"{Colors.WARNING}  Installing React dependencies (this may take a minute)...{Colors.ENDC}")
        try:
            # Use npm.cmd on Windows for subprocess compatibility
            npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
            install = subprocess.run(
                [npm_cmd, "install"],
                cwd=react_dir,
                capture_output=True,
                text=True,
                timeout=120
            )
            if install.returncode != 0:
                print(f"{Colors.FAIL}✗ npm install failed{Colors.ENDC}")
                print(f"  Error: {install.stderr[:200]}")
                return False
        except subprocess.TimeoutExpired:
            print(f"{Colors.FAIL}✗ npm install timed out{Colors.ENDC}")
            return False
        except Exception as e:
            print(f"{Colors.FAIL}✗ npm install error: {e}{Colors.ENDC}")
            return False
    
    try:
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        process = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=react_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        processes.append(('React Client', process))
        print(f"{Colors.GREEN}✓ React Client started (PID: {process.pid}){Colors.ENDC}")
        print(f"  URL: http://localhost:3000\n")
        return True
    except Exception as e:
        print(f"{Colors.FAIL}✗ Failed to start React client: {e}{Colors.ENDC}")
        return False

def cleanup():
    """Terminate all processes"""
    print(f"\n{Colors.WARNING}Shutting down all services...{Colors.ENDC}")
    for name, process in processes:
        try:
            process.terminate()
            process.wait(timeout=5)
            print(f"{Colors.GREEN}✓ {name} stopped{Colors.ENDC}")
        except Exception as e:
            print(f"{Colors.FAIL}✗ Error stopping {name}: {e}{Colors.ENDC}")
            try:
                process.kill()
            except:
                pass

def signal_handler(sig, frame):
    """Handle Ctrl+C"""
    cleanup()
    sys.exit(0)

def main():
    print_banner()
    
    # Check prerequisites
    print(f"{Colors.BLUE}Checking prerequisites...{Colors.ENDC}\n")
    if not check_node_installed():
        print(f"\n{Colors.FAIL}Cannot start web services without Node.js{Colors.ENDC}")
        print(f"{Colors.CYAN}Exiting...{Colors.ENDC}\n")
        sys.exit(1)
    
    print()
    
    # Register signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start services
    if not start_python_server():
        cleanup()
        return
    
    if not start_node_server():
        cleanup()
        return
    
    if not start_react_client():
        cleanup()
        return
    
    # Success message
    print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*60}")
    print(f"   ✓ All services started successfully!")
    print(f"{'='*60}{Colors.ENDC}\n")
    
    print(f"{Colors.CYAN}Access the application:{Colors.ENDC}")
    print(f"  • React UI:       {Colors.BOLD}http://localhost:3000{Colors.ENDC}")
    print(f"  • Dashboard:      {Colors.BOLD}http://localhost:3000/dashboard{Colors.ENDC}")
    print(f"  • Node API:       http://localhost:5000/health")
    print(f"  • Python API:     http://localhost:8000/api/dashboard-stats")
    
    print(f"\n{Colors.WARNING}Press Ctrl+C to stop all services{Colors.ENDC}\n")
    
    # Keep script running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
