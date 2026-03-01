# TCRAS System Walkthrough

## Overview
This document guides you through the complete functionality of the hardened TCRAS system.

## 1. System Startup
Run the master script to launch all components:
```bash
python scripts/run_all.py
```
This will:
1. Load configuration from `config.yaml`.
2. Start the **TCRAS Server** on the configured host/port.
3. Start the **File Monitor Agent** watching the configured directory.
4. Open the **Dashboard**.
5. Launch the **Transfer App**.

## 2. Dashboard Features
The dashboard provides real-time visibility:
- **Status Card**: Shows overall network threat level (SECURE, ELEVATED, CRITICAL).
- **Network Graph**: Center view showing nodes and transfer links. Drag nodes to explore.
- **Event Log**: Left panel streaming live file events.
- **Device Risk Table**: Right panel showing risk scores per IP.

## 3. Secure File Transfer
1. Open the **Transfer App**.
2. Select a file.
3. Enter a Target IP.
4. Click **VERIFY & SEND**.
    - The app checks the Server's Risk Engine first.
    - If Risk is HIGH, transfer is BLOCKED.
    - If Risk is MEDIUM, a warning is shown.
    - If ALLOWED, the file is sent.

## 4. Security & Hardening
- **API Key**: All communications are secured with `X-API-Key`.
- **Config**: Change settings in `config.yaml` without touching code.
- **Resilience**: The Dashboard auto-reconnects if the server restarts.

## 5. Troubleshooting
- **Missing Config**: Ensure `config.yaml` is in the root.
- **Connection Failed**: check if Server is running and port matches config.
- **Logs**: Check console output for detailed error messages.
