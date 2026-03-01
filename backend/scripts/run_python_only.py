"""
TCRAS Python-Only Launcher
Starts only the Python AI server and existing HTML dashboard
No Node.js required
"""

import subprocess
import sys
import os
import webbrowser
import time

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    print(f"\n{Colors.CYAN}{'='*60}")
    print(f"{Colors.BOLD}   TCRAS - Python Edition")
    print(f"   (No Node.js Required){Colors.ENDC}")
    print(f"{Colors.CYAN}{'='*60}{Colors.ENDC}\n")

def main():
    print_banner()
    
    print(f"{Colors.BLUE}Starting Python AI Server...{Colors.ENDC}\n")
    
    try:
        # Start Python server
        process = subprocess.Popen(
            [sys.executable, "scripts/run_server.py"],
            cwd=os.getcwd()
        )
        
        print(f"{Colors.GREEN}✓ Python Server started (PID: {process.pid}){Colors.ENDC}")
        print(f"  URL: http://localhost:8000\n")
        
        # Wait for server to initialize
        print(f"{Colors.CYAN}Waiting for server to initialize...{Colors.ENDC}")
        time.sleep(3)
        
        # Open browser
        print(f"{Colors.GREEN}Opening dashboard in browser...{Colors.ENDC}\n")
        webbrowser.open('http://localhost:8000')
        
        print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*60}")
        print(f"   ✓ TCRAS is running!")
        print(f"{'='*60}{Colors.ENDC}\n")
        
        print(f"{Colors.CYAN}Access points:{Colors.ENDC}")
        print(f"  • Dashboard:  {Colors.BOLD}http://localhost:8000{Colors.ENDC}")
        print(f"  • API:        http://localhost:8000/api/dashboard-stats")
        
        print(f"\n{Colors.CYAN}To transfer files:{Colors.ENDC}")
        print(f"  • Run: {Colors.BOLD}python client_transfer_only.py{Colors.ENDC}")
        print(f"  • Or:  {Colors.BOLD}python src/transfer_app/main.py{Colors.ENDC}")
        
        print(f"\n{Colors.WARNING}Press Ctrl+C to stop the server{Colors.ENDC}\n")
        
        # Keep running
        try:
            process.wait()
        except KeyboardInterrupt:
            print(f"\n{Colors.WARNING}Shutting down...{Colors.ENDC}")
            process.terminate()
            process.wait(timeout=5)
            print(f"{Colors.GREEN}✓ Server stopped{Colors.ENDC}\n")
            
    except Exception as e:
        print(f"{Colors.FAIL}✗ Error: {e}{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()
