# TCRAS Setup & Execution Guide

## Prerequisites
- Windows 10/11
- Python 3.10+
- Pip (Python Package Manager)

## Installation

1. **Clone/Unzip the Repository** to your local machine.
2. **Install Dependencies**:
   ```powershell
   cd TCRAS
   pip install -r requirements.txt
   ```

## Running the System

We provide a single automation script to launch all components:

```powershell
python scripts/run_all.py
```

This will automatically:
1. Start the **FastAPI Server** (Background).
2. Start the **TCRAS Agent** (Background).
3. Launch the **Transfer App** (GUI).
4. Open the **Dashboard** in your default web browser.

## Manual Execution (Individual Components)

If you prefer to run components separately:

### 1. Install Dependencies
Run this command to ensure all new libraries (including PyYAML) are installed:
```bash
pip install -r requirements.txt
```

### 2. Configuration
1.  **Edit `config.yaml`** in the root directory.
    *   **Server**: Host (0.0.0.0), Port (8000), DB Path.
    *   **Security**: Set `api_key` (Must match in Agent/App).
    *   **Agent**: Set `root_watch_dir` folder path.

### 2. Database
1.  **Initialize**:
    *   The system auto-initializes `tcras.db` (as defined in config) on first run.

### 3. Run Scripts
1.  **Start Everything**:
    ```bash
    python scripts/run_all.py
    ```

**4. Server**
```powershell
python scripts/run_server.py
```
*Access at http://localhost:8000*

**5. Agent**
```powershell
python scripts/run_agent.py
```

**6. Transfer App**
```powershell
python src/transfer_app/main.py
```

## Troubleshooting
- **Port 8000 in use**: Ensure no other service is running on port 8000.
- **Agent not detecting**: Check the `monitored_files` directory exists and you are creating files *inside* it.
