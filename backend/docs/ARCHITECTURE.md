# TCRAS System Architecture

## Overview
The Transfer-Chain Risk Amplification System (TCRAS) is designed to monitor, analyze, and visualize file transfers within a local network to detect potential security threats such as malware propagation (worm-like behavior) or data exfiltration.

## Components

### 1. Agent Layer (`src/agent`)
- **Technology**: Python, Watchdog, Requests.
- **Responsibility**: Monitors the file system for creation events.
- **Data Flow**: Captures file metadata (hash, size, path) -> Sends HTTP POST to Server.

### 2. Server Layer (`src/server`)
- **Technology**: FastAPI, Uvicorn, SQLAlchemy.
- **Responsibility**: Central processing hub.
- **Modules**:
    - **API**: Receives events, streams SSE updates.

### 3. Core Components
*   **Graph Engine**: Manages the directed graph network (NetworkX).
*   **Risk Engine**: Calculates risk scores using Isolation Forest (Sklearn).
*   **Config Loader**: Centralized settings manager (`src/server/core/config.py`).
*   **Security Layer**: Enforces `X-API-Key` validation on sensitive endpoints.

### 4. Database
*   **SQLite**: Thread-safe storage for events and snapshots.

### 5. Frontend / Dashboard (`src/server/templates`)
- **Technology**: HTML5, TailwindCSS, Anime.js, Vis.js.
- **Responsibility**: Real-time visualization of the network graph and risk alerts.
- **Communication**: Server-Sent Events (SSE) for sub-second updates.

### 4. Transfer Application (`src/transfer_app`)
- **Technology**: Python Tkinter (ttkbootstrap).
- **Responsibility**: secure file transfer utility for users.
- **Integration**: Simulates the activity that the Agent monitors.

## Data Flow Pipeline
1. **User** sends file via Transfer App.
2. **Agent** detects file creation on destination.
3. **Agent** sends JSON payload to **Server API**.
4. **Server** updates **Graph Engine** (adds edge).
5. **Server** queries **Risk Engine** (calculates score).
6. **Server** broadcasts event via **SSE**.
7. **Dashboard** receives event -> Animates Graph & Updates Logs.
