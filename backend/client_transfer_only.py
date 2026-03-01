import tkinter as tk
from tkinter import filedialog
import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from ttkbootstrap.toast import ToastNotification
import requests
import hashlib
import os
import socket
import datetime
import threading
import time
import random
import yaml

# -----------------------------------------------------------------------------
# CONFIGURATION & CONSTANTS
# -----------------------------------------------------------------------------
SERVER_URL_DEFAULT = "http://localhost:8000/api/transfer/check"
CONFIG_FILE = "config.yaml"
THEME_NAME = "cyborg"  # Dark, cyber-security aesthetic

# -----------------------------------------------------------------------------
# HELPER FUNCTIONS
# -----------------------------------------------------------------------------

def get_file_hash(filepath):
    """Calculates SHA256 hash of the file."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Read and update hash string value in blocks of 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def load_api_key():
    """Attempts to load API key from config.yaml."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = yaml.safe_load(f)
                return config.get('security', {}).get('api_key', '')
        except Exception:
            pass
    return ''

# -----------------------------------------------------------------------------
# MAIN APPLICATION CLASS
# -----------------------------------------------------------------------------
class SecureTransferClient(ttk.Window):
    def __init__(self):
        super().__init__(themename=THEME_NAME)
        self.title("TCRAS Secure Transfer Client")
        self.geometry("900x650")
        self.resizable(False, False)
        
        # State
        self.selected_file_path = None
        self.metadata = {}
        self.api_key = load_api_key()
        
        # UI Setup
        self._setup_styles()
        self._build_ui()
        
        self.log_action("System initialized. Ready for secure transfer.")
        if self.api_key:
            self.log_action("API Key loaded from configuration.")
        else:
            self.log_action("No API Key found. Transfers may be restricted.")

    def _setup_styles(self):
        """Custom styles for a 'glassmorphism' feel."""
        style = self.style
        style.configure('Card.TFrame', background='#1a1a1a', bordercolor='#333', borderwidth=1, relief='solid')
        style.configure('Risk.TLabel', font=('Segoe UI', 12, 'bold'))
        style.configure('Log.TFrame', background='#111')

    def _build_ui(self):
        # --- TITLE HEADER ---
        header_frame = ttk.Frame(self, padding=20)
        header_frame.pack(fill=X)
        
        lbl_title = ttk.Label(
            header_frame, 
            text="TCRAS SECURITY CLIENT", 
            font=("Orbitron", 24, "bold"), 
            bootstyle="info"
        )
        lbl_title.pack(side=LEFT)
        
        lbl_subtitle = ttk.Label(
            header_frame,
            text="endpoint_security_ver_2.4.0",
            font=("Consolas", 10),
            foreground="#666"
        )
        lbl_subtitle.pack(side=LEFT, padx=15, pady=(12, 0))

        # --- MAIN CONTENT AREA ---
        content_frame = ttk.Frame(self, padding=20)
        content_frame.pack(fill=BOTH, expand=YES)
        
        # LEFT COLUMN (Controls)
        left_col = ttk.Frame(content_frame)
        left_col.pack(side=LEFT, fill=BOTH, expand=YES, padx=(0, 10))
        
        # File Selection Card
        self._build_card(left_col, "Source Payload", self._build_file_selector)
        
        # Target Selection Card
        self._build_card(left_col, "Destination Vector", self._build_target_selector)
        
        # Action Button
        self.btn_send = ttk.Button(
            left_col, 
            text="VERIFY & EXECUTE TRANSFER", 
            bootstyle="success-outline", 
            command=self.start_verification_thread,
            width=30
        )
        self.btn_send.pack(pady=20, fill=X)
        
        # Risk Badge (Hidden initially)
        self.risk_badge_frame = ttk.Frame(left_col, padding=10, style='Card.TFrame')
        self.risk_badge_frame.pack(fill=X, pady=10)
        
        self.lbl_risk_title = ttk.Label(self.risk_badge_frame, text="RISK ASSESSMENT", font=("Segoe UI", 10))
        self.lbl_risk_title.pack(anchor=W)
        
        self.lbl_risk_status = ttk.Label(
            self.risk_badge_frame, 
            text="WAITING FOR ANALYSIS...", 
            font=("Segoe UI", 16, "bold"), 
            foreground="#555"
        )
        self.lbl_risk_status.pack(anchor=CENTER, pady=10)

        # RIGHT COLUMN (Logs)
        right_col = ttk.Frame(content_frame)
        right_col.pack(side=RIGHT, fill=BOTH, expand=YES, padx=(10, 0))
        
        self._build_card(right_col, "Security Event Log", self._build_log_panel, expand=True)

    def _build_card(self, parent, title, content_builder, expand=False):
        card = ttk.Frame(parent, padding=2, style='Card.TFrame')
        card.pack(fill=BOTH, expand=expand, pady=(0, 20))
        
        inner = ttk.Frame(card, padding=15)
        inner.pack(fill=BOTH, expand=YES)
        
        lbl = ttk.Label(inner, text=title.upper(), font=("Segoe UI", 9, "bold"), foreground="#888")
        lbl.pack(anchor=W, pady=(0, 10))
        
        content_builder(inner)

    def _build_file_selector(self, parent):
        self.lbl_filename = ttk.Label(parent, text="No file selected", font=("Segoe UI", 11), foreground="#aaa")
        self.lbl_filename.pack(fill=X, pady=(0, 10))
        
        btn_browse = ttk.Button(
            parent, 
            text="SELECT FILE", 
            bootstyle="secondary", 
            command=self.select_file
        )
        btn_browse.pack(anchor=W)

    def _build_target_selector(self, parent):
        self.ent_ip = ttk.Entry(parent, font=("Consolas", 11))
        self.ent_ip.pack(fill=X, pady=(0, 5))
        self.ent_ip.insert(0, "192.168.1.100")
        
        ttk.Label(parent, text="Enter Target IP Address", font=("Segoe UI", 8), foreground="#666").pack(anchor=W)

    def _build_log_panel(self, parent):
        self.txt_log = tk.Text(
            parent, 
            bg="#0f0f0f", 
            fg="#0f0", 
            font=("Consolas", 9), 
            bd=0, 
            highlightthickness=0,
            state=DISABLED
        )
        self.txt_log.pack(fill=BOTH, expand=YES)

    # -------------------------------------------------------------------------
    # LOGIC
    # -------------------------------------------------------------------------

    def log_action(self, message):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.txt_log.config(state=NORMAL)
        self.txt_log.insert(END, f"[{timestamp}] {message}\n")
        self.txt_log.see(END)
        self.txt_log.config(state=DISABLED)

    def select_file(self):
        path = filedialog.askopenfilename()
        if path:
            self.selected_file_path = path
            size = os.path.getsize(path)
            self.lbl_filename.config(text=f"{os.path.basename(path)} ({self._format_size(size)})", foreground="#fff")
            self.log_action(f"File selected: {os.path.basename(path)}")
            
            # Reset Risk Badge
            self.lbl_risk_status.config(text="READY TO VERIFY", foreground="#fff")

    def _format_size(self, size):
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    def start_verification_thread(self):
        if not self.selected_file_path:
            self.show_toast("Input Error", "Please select a file first.", "danger")
            return
        
        target_ip = self.ent_ip.get().strip()
        if not target_ip:
            self.show_toast("Input Error", "Please enter a target IP.", "danger")
            return

        self.btn_send.config(state=DISABLED)
        self.lbl_risk_status.config(text="ANALYZING...", foreground="#0dcaf0")
        
        # Run in thread to keep UI responsive
        threading.Thread(target=self._process_verification, args=(target_ip,), daemon=True).start()

    def _process_verification(self, target_ip):
        try:
            # 1. Generate Metadata
            self.log_action("Generating cryptographic metadata...")
            file_hash = get_file_hash(self.selected_file_path)
            file_size = os.path.getsize(self.selected_file_path)
            filename = os.path.basename(self.selected_file_path)
            
            hostname = socket.gethostname()
            try:
                ip_addr = socket.gethostbyname(hostname)
            except:
                ip_addr = "127.0.0.1"

            payload = {
                "filename": filename,
                "file_hash": file_hash,
                "file_size": file_size,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "src_ip": ip_addr,
                "dst_ip": target_ip,
                # Extra fields for heuristic analysis
                "extension": os.path.splitext(filename)[1],
            }
            
            self.log_action(f"Hash calculated: {file_hash[:12]}...")

            # 2. Send to Server
            self.log_action(f"Contacting security node: {SERVER_URL_DEFAULT}...")
            
            headers = {}
            if self.api_key:
                headers["X-API-Key"] = self.api_key

            try:
                response = requests.post(SERVER_URL_DEFAULT, json=payload, headers=headers, timeout=3)
                if response.status_code == 200:
                    decision_data = response.json()
                    self._handle_decision(decision_data)
                elif response.status_code == 403:
                    self.log_action("ERROR: API Key rejected by server.")
                    self._handle_server_failure(auth_error=True)
                else:
                    self.log_action(f"Server error: {response.status_code}")
                    self._handle_server_failure()
                    
            except requests.exceptions.RequestException:
                self.log_action("Server unreachable. Entering Offline Security Protocol (DEMO).")
                time.sleep(1.5) # Simulate processing delay
                self._run_demo_simulation()

        except Exception as e:
            self.log_action(f"Critical Error: {str(e)}")
            self.after(0, lambda: self.btn_send.config(state=NORMAL))

    def _handle_decision(self, data):
        decision = data.get("decision", "BLOCK")
        risk = data.get("risk_score", 100)
        reason = data.get("reason", "Unknown Policy")
        
        self.after(0, lambda: self._update_ui_result(decision, risk, reason))

    def _handle_server_failure(self, auth_error=False):
        if auth_error:
            self.after(0, lambda: self._update_ui_result("BLOCK", 100, "Authentication Failed"))
        else:
            self.after(0, lambda: self._run_demo_simulation())

    def _run_demo_simulation(self):
        # Simulate logic for demonstration when server is offline
        decisions = ["ALLOW", "WARN", "BLOCK"]
        weights = [0.6, 0.3, 0.1]
        decision = random.choices(decisions, weights)[0]
        
        if decision == "ALLOW":
            risk = random.randint(0, 20)
            reason = "Standard traffic pattern"
        elif decision == "WARN":
            risk = random.randint(40, 70)
            reason = "Unusual file extension or time"
        else:
            risk = random.randint(80, 100)
            reason = "Known signature pattern match"
            
        self.after(0, lambda: self._update_ui_result(decision, risk, reason, demo=True))

    def _update_ui_result(self, decision, risk, reason, demo=False):
        self.btn_send.config(state=NORMAL)
        
        prefix = "[DEMO] " if demo else ""
        
        if decision == "ALLOW":
            color = "success"
            text_color = "#28a745"
            self.show_toast("Transfer Approved", f"{prefix}Risk Level: {risk}/100\nReason: {reason}", "success")
        elif decision == "WARN":
            color = "warning"
            text_color = "#ffc107"
            self.show_toast("Security Warning", f"{prefix}Risk Level: {risk}/100\nReason: {reason}", "warning")
        else:
            color = "danger"
            text_color = "#dc3545"
            self.show_toast("Transfer Blocked", f"{prefix}Transfer rejected by policy.\nReason: {reason}", "danger")

        # Update Badge
        self.lbl_risk_status.config(text=f"{decision} ({risk}%)", foreground=text_color)
        
        # Log
        self.log_action(f"DECISION: {decision}")
        self.log_action(f"Risk Score: {risk} | Reason: {reason}")
        
        if decision == "ALLOW":
            self.log_action(">> Simulating secure file stream initiation...")
            self.log_action(">> Transfer Complete.")
        else:
             self.log_action(">> Transfer Aborted by Protocol.")

    def show_toast(self, title, message, bootstyle):
        toast = ToastNotification(
            title=title,
            message=message,
            duration=3000,
            bootstyle=bootstyle
        )
        toast.show_toast()

if __name__ == "__main__":
    app = SecureTransferClient()
    app.mainloop()
