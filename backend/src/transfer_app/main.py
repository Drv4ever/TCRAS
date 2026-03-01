import tkinter as tk
from tkinter import filedialog
import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from ttkbootstrap.dialogs import Messagebox
import threading
import logging
import winsound
import os
import requests
import sys
# Ensure project root is in path to import src.server.core.config
# File is in src/transfer_app/main.py -> ../.. -> src/ -> TCRAS/
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src.server.core.config import settings
from src.transfer_app.transfer import send_file, start_receiver, PORT

# Setup logging
logging.basicConfig(level=logging.INFO)

class TransferApp(ttk.Window):
    def __init__(self):
        super().__init__(themename="cyborg") # Modern dark theme
        self.title("TCRAS Secure Transfer")
        self.geometry("600x450")
        
        self.selected_file = None
        self.api_key = settings.get_api_key()
        if not self.api_key:
             Messagebox.show_warning("API Key missing in config.yaml! Security disabled.", "Security Alert")

        self._init_ui()
        self._start_receiver_service()


    def _start_receiver_service(self):
        """Starts the background file receiver thread."""
        self.receiver_thread = start_receiver()
        self.log(f"Receiver service listening on port {PORT}")


    def _init_ui(self):
        # Header
        header = ttk.Label(self, text="LAN Secure Transfer", font=("Segoe UI", 20, "bold"), bootstyle="info")
        header.pack(pady=20)

        # File Selection Frame
        file_frame = ttk.Labelframe(self, text="File Selection", padding=15)
        file_frame.pack(fill=X, padx=20, pady=10)

        self.file_label = ttk.Label(
            file_frame, 
            text="Drag and Drop supported (Simulated)", 
            font=("Segoe UI", 10), 
            foreground="#888"
        )
        self.file_label.pack(side=LEFT, fill=X, expand=YES, padx=5)

        select_btn = ttk.Button(file_frame, text="Select File", command=self.select_file, bootstyle="secondary-outline")
        select_btn.pack(side=RIGHT)
        
        # Open Folder Button
        open_folder_btn = ttk.Button(file_frame, text="📂 Received", command=self.open_received_folder, bootstyle="link")
        open_folder_btn.pack(side=RIGHT, padx=10)

        # Target IP Frame
        ip_frame = ttk.Labelframe(self, text="Destination", padding=15)
        ip_frame.pack(fill=X, padx=20, pady=10)
        
        ttk.Label(ip_frame, text="Target IP:").pack(side=LEFT, padx=5)
        self.ip_entry = ttk.Entry(ip_frame)
        self.ip_entry.pack(side=LEFT, fill=X, expand=YES, padx=5)
        self.ip_entry.insert(0, "127.0.0.1")

        # Actions
        action_frame = ttk.Frame(self, padding=20)
        action_frame.pack(fill=X)

        self.send_btn = ttk.Button(
            action_frame, 
            text="VERIFY & SEND", 
            command=self.start_transfer, 
            bootstyle="success-outline", 
            width=20
        )
        self.send_btn.pack(side=TOP, pady=5)

        self.progress = ttk.Progressbar(action_frame, mode='indeterminate', bootstyle="success-striped")
        self.progress.pack(fill=X, pady=10)

        # Log Window
        log_frame = ttk.Labelframe(self, text="Activity Log", padding=5)
        log_frame.pack(fill=BOTH, expand=YES, padx=20, pady=5)
        
        self.log_text = tk.Text(log_frame, height=5, bg="#222", fg="#0f0", font=("Consolas", 8), state=DISABLED)
        self.log_text.pack(fill=BOTH, expand=YES)

        # Status
        self.status_label = ttk.Label(self, text="System Ready", font=("Segoe UI", 9), bootstyle="secondary")
        self.status_label.pack(side=BOTTOM, pady=5)
    
    def log(self, message):
        self.log_text.config(state=NORMAL)
        self.log_text.insert(END, f"> {message}\n")
        self.log_text.see(END)
        self.log_text.config(state=DISABLED)

    def select_file(self):
        filename = filedialog.askopenfilename()
        if filename:
            self.selected_file = filename
            self.file_label.config(text=os.path.basename(filename), foreground="#fff")
            self.log(f"Selected file: {filename}")

    def open_received_folder(self):
        folder = os.path.abspath("received_files")
        if not os.path.exists(folder):
            os.makedirs(folder)
        os.startfile(folder)
        self.log(f"Opened received folder: {folder}")

    def verify_risk(self, target_ip):
        """Calls server to check risk before transfer."""
        try:
             url = f"{settings.get_server_url()}/api/risk/check"
             headers = {"X-API-Key": self.api_key}
             payload = {
                 "filename": os.path.basename(self.selected_file),
                 "source_ip": "127.0.0.1", # Self IP
                 "destination_ip": target_ip,
                 "file_size_bytes": os.path.getsize(self.selected_file)
             }
             resp = requests.post(url, json=payload, headers=headers)
             if resp.status_code == 200:
                 return resp.json()
             else:
                 self.log(f"Risk check failed: {resp.status_code}")
                 return None
        except Exception as e:
            self.log(f"Risk check error: {e}")
            return None

    def start_transfer(self):
        target_ip = self.ip_entry.get()
        if not self.selected_file:
            Messagebox.show_warning("Please select a file first.", "Warning")
            return
        if not target_ip:
            Messagebox.show_warning("Please enter a target IP.", "Warning")
            return

        self.log("Verifying risk with server...")
        risk_data = self.verify_risk(target_ip)
        
        if risk_data:
            score = risk_data.get('score', 0)
            level = risk_data.get('level', 'UNKNOWN')
            allowed = risk_data.get('allowed', True)
            
            self.log(f"Risk Score: {score} ({level})")
            
            if not allowed:
                Messagebox.show_error(f"Transfer BLOCKED by Policy!\nRisk Level: {level}", "Security Block")
                return

            if level == 'MEDIUM':
                 confirm = Messagebox.show_question(
                    f"Risk Level is MEDIUM ({score}).\nProceed with transfer to {target_ip}?", 
                    "Risk Warning"
                )
                 if confirm != "Yes": return
        else:
             # Fallback if server offline
             confirm = Messagebox.show_question("Server unreachable. Proceed with caution?", "Connection Warning")
             if confirm != "Yes": return

        # UI Updates
        self.send_btn.config(state=DISABLED)
        self.progress.start(10)
        self.status_label.config(text=f"Sending {os.path.basename(self.selected_file)}...", bootstyle="warning")
        self.log(f"Initiating transfer to {target_ip}...")

        # Run in thread
        threading.Thread(target=self._run_transfer, args=(target_ip,), daemon=True).start()

    def _run_transfer(self, target_ip):
        try:
            # Simulate a small delay for animation effect
            import time
            time.sleep(1.5) 
            send_file(self.selected_file, target_ip)
            self.after(0, self._on_success)
        except Exception as e:
            self.after(0, lambda: self._on_failure(str(e)))

    def _on_success(self):
        self.progress.stop()
        self.send_btn.config(state=NORMAL)
        self.status_label.config(text="Transfer Complete", bootstyle="success")
        self.log("Transfer successful.")
        winsound.MessageBeep(winsound.MB_OK)
        
        # Windows Toast Notification (Simulated with TopLevel if plyer missing)
        self.show_toast("Success", f"File sent to {self.ip_entry.get()}")
        

    def _on_failure(self, error):
        self.progress.stop()
        self.send_btn.config(state=NORMAL)
        self.status_label.config(text="Transfer Failed", bootstyle="danger")
        self.log(f"Error: {error}")
        winsound.MessageBeep(winsound.MB_ICONHAND)
        Messagebox.show_error(f"Transfer failed: {error}", "Error")

    def show_toast(self, title, message):
        """Custom Toast Notification"""
        toast = tk.Toplevel(self)
        toast.overrideredirect(True)
        toast.geometry("300x80+50+50") # Top left or calculate screen pos
        toast.configure(bg="#333")
        
        # Position bottom right
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        x = screen_width - 320
        y = screen_height - 150
        toast.geometry(f"300x80+{x}+{y}")
        
        ttk.Label(toast, text=title, font=("Segoe UI", 10, "bold"), background="#333", foreground="#fff").pack(anchor=W, padx=10, pady=5)
        ttk.Label(toast, text=message, font=("Segoe UI", 9), background="#333", foreground="#ccc").pack(anchor=W, padx=10)
        
        # Fade out
        def fade():
            try:
                toast.destroy()
            except: pass
        self.after(3000, fade)

if __name__ == "__main__":
    app = TransferApp()
    app.mainloop()
