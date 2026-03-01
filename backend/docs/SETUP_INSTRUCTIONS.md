# TCRAS Setup Instructions

## Prerequisites
- Two Windows Laptops (connected to same Wi-Fi/LAN)
- Python 3.10+ installed on both
- Git installed

## 1. Environment Setup (On Both Laptops)
1.  **Clone the Repository**:
    ```powershell
    git clone https://github.com/yourusername/TCRAS.git
    cd TCRAS
    ```
2.  **Install Dependencies**:
    ```powershell
    pip install -r requirements.txt
    ```

## 2. Server Setup (Laptop A)
This laptop will act as the Central Security Server.
1.  **Find IP Address**:
    Run `ipconfig` in CMD and note the IPv4 Address (e.g., `192.168.1.10`).
2.  **Start Server**:
    ```powershell
    python -m src.server.main
    ```
    The server will start at `http://0.0.0.0:8000`.
3.  **Firewall Access**:
    If Windows Firewall pops up, allow access for Python on Private Networks.

## 3. Agent Setup (Laptop A & Laptop B)
Run the agent on all devices you want to monitor.

**On Laptop A (Server Machine):**
```powershell
# Create a folder to watch
mkdir C:\TCRAS_Shared
python -m src.agent.main "C:\TCRAS_Shared"
```

**On Laptop B (Client Machine):**
1.  Open `src/agent/file_monitor.py` and change `SERVER_URL` to point to Laptop A's IP:
    `SERVER_URL = "http://192.168.1.10:8000/api/event"`
2.  Start Agent:
    ```powershell
    mkdir C:\TCRAS_Shared
    python -m src.agent.main "C:\TCRAS_Shared"
    ```

## 4. Testing File Transfer Detection
We will simulate a transfer using the Custom Transfer App.

1.  **Launch Transfer App (Any Laptop)**:
    ```powershell
    python -m src.transfer_app.main
    ```
2.  **Configure Receiver**:
    The app automatically starts a receiver on port 9999.
3.  **Send File**:
    - Select a file (e.g., a dummy `.txt` or `.exe`).
    - Enter Target IP (e.g., Laptop B's IP `192.168.1.11`).
    - Click **SEND FILE**.
4.  **Observe**:
    - The file will arrive in `received_files/` folder.
    - **Note**: To trigger the *Agent*, you should move the received file into the *Monitored Folder* (`C:\TCRAS_Shared`).
    - *Alternatively*, you can drag-drop files directly into the Shared Folder via Windows Network Sharing.

## 5. View Dashboard
1.  Open Browser on Laptop A: `http://localhost:8000`
2.  Watch the Graph build up as you move files into `C:\TCRAS_Shared`.
3.  **Trigger High Risk**:
    - Rapidly copy the same file back and forth between folders or laptops.
    - Or transfer a file named `worm.exe` (if logic added) or create a cyclic graph (A->B->A).
