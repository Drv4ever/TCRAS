# Transfer-Chain Risk Amplification System (TCRAS)

**TCRAS** is an AI-powered cybersecurity system designed to monitor, analyze, and visualize file transfers inside a Local Area Network (LAN). It detects suspicious patterns such as rapid malware-like propagation, lateral movement, and repeated high-risk transfer chains using Graph Analysis and Machine Learning.

## Key Features
- **Real-time File Monitoring**: Lightweight agent watches file system events.
- **Transfer Chain Graph Modeling**: Models file movement as a graph (NetworkX).
- **AI-Based Risk Scoring**: Isolation Forest & LOF for anomaly detection.
- **Centralized Dashboard**: Animated, modern web interface with real-time alerts.
- **Custom Transfer App**: Secure tool for testing and controlled transfers.

## Tech Stack
- **Backend**: Python, FastAPI, SQLite
- **AI/Graph**: Scikit-learn, NetworkX
- **Frontend**: HTML5, TailwindCSS, Anime.js, Jinja2
- **Agent**: Watchdog (Python)
- **Desktop App**: Tkinter (ttkbootstrap)

## Setup Instructions
1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Start Server**:
    ```bash
    python -m src.server.main
    ```
3.  **Start Agent**:
    ```bash
    python -m src.agent.main
    ```
