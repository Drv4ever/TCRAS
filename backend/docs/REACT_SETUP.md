# TCRAS React + Node.js Setup Guide

## Prerequisites

Before running the upgraded TCRAS system, ensure you have:

- ✅ **Python 3.13+** (for AI server)
- ✅ **Node.js 18+** and npm (for Node server and React client)
- ✅ **All Python dependencies** installed (`pip install -r requirements.txt`)

## Quick Start

### Option 1: Run All Services (Recommended)

Use the unified launch script:

```bash
python scripts/run_all_web.py
```

This will start:
1. Python AI Server (port 8000)
2. Node.js Transfer Server (port 5000)
3. React Frontend (port 3000)

### Option 2: Run Services Individually

#### 1. Start Python AI Server

```bash
cd "c:\Users\rishi\OneDrive\Documents\software engineering project\TCRAS"
python scripts/run_server.py
```

**Expected output:**
```
╔════════════════════════════════════════════════════════╗
║   TCRAS Security Server                                ║
╚════════════════════════════════════════════════════════╝
🚀 Server running on http://0.0.0.0:8000
```

#### 2. Start Node.js Transfer Server

```bash
cd "c:\Users\rishi\OneDrive\Documents\software engineering project\TCRAS\node-server"
npm install  # First time only
npm start
```

**Expected output:**
```
╔════════════════════════════════════════════════════════╗
║   TCRAS Node.js Transfer Server                        ║
╚════════════════════════════════════════════════════════╝
🚀 Server running on port 5000
🔗 Python AI Server: http://localhost:8000
```

#### 3. Start React Frontend

```bash
cd "c:\Users\rishi\OneDrive\Documents\software engineering project\TCRAS\react-client"
npm install  # First time only
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

## Accessing the Application

Once all services are running:

- **React UI**: http://localhost:3000
- **Transfer Page**: http://localhost:3000/ (default)
- **Dashboard**: http://localhost:3000/dashboard
- **Node API**: http://localhost:5000/health
- **Python API**: http://localhost:8000/api/dashboard-stats

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│                  (localhost:3000)                       │
│  - File Upload UI                                       │
│  - Risk Visualization                                   │
│  - Real-time Dashboard                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST /api/upload
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Transfer Server                    │
│                  (localhost:5000)                       │
│  - File upload handling (multer)                        │
│  - LAN transfer (TCP sockets)                           │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST /api/risk/check
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Python AI Server                           │
│                  (localhost:8000)                       │
│  - Isolation Forest risk engine                         │
│  - NetworkX graph analysis                              │
│  - SQLite database                                      │
│  - SSE real-time updates                                │
└─────────────────────────────────────────────────────────┘
```

## Usage Workflow

### 1. File Transfer

1. Open http://localhost:3000
2. Drag and drop a file or click "Browse Files"
3. Enter destination IP (e.g., `192.168.1.100`)
4. Click **"VERIFY & UPLOAD"**
5. Wait for risk assessment
6. If allowed, click **"EXECUTE TRANSFER"**

### 2. Monitor Dashboard

1. Open http://localhost:3000/dashboard
2. View real-time transfer events
3. See network graph visualization
4. Monitor risk statistics

## Configuration

### Node Server (.env)

Edit `node-server/.env`:

```env
PYTHON_SERVER_URL=http://localhost:8000
API_KEY=tcras_secure_key_2024
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Python Server (config.yaml)

Edit `config.yaml`:

```yaml
server:
  host: "0.0.0.0"
  port: 8000

security:
  api_key: "tcras_secure_key_2024"
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

**Python (port 8000):**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Node (port 5000):**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**React (port 3000):**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CORS Errors

If you see CORS errors in browser console:
1. Ensure Node server is running
2. Check `ALLOWED_ORIGINS` in `node-server/.env`
3. Restart Node server after changes

### SSE Connection Failed

If dashboard doesn't show real-time updates:
1. Verify Python server is running on port 8000
2. Check browser console for SSE errors
3. Ensure API key matches in both servers

### File Upload Fails

If file upload returns 500 error:
1. Check Node server logs
2. Verify Python server is reachable
3. Check `uploads/` directory exists in `node-server/`

## Development Mode

For development with hot reload:

**React:**
```bash
cd react-client
npm run dev
```

**Node (with nodemon):**
```bash
cd node-server
npm run dev
```

## Building for Production

### React Frontend

```bash
cd react-client
npm run build
```

Output will be in `react-client/dist/`

### Deployment

For production deployment:
1. Build React app
2. Serve React build with a static server (nginx, Apache)
3. Run Node server with PM2 or similar process manager
4. Run Python server with systemd or supervisor

## Backward Compatibility

The existing Tkinter clients continue to work:

**Standalone Client:**
```bash
python client_transfer_only.py
```

**Integrated Transfer App:**
```bash
python src/transfer_app/main.py
```

Both clients communicate directly with the Python AI server on port 8000.

## Next Steps

1. **Test the system**: Upload a file and verify risk assessment works
2. **Monitor dashboard**: Trigger file events and watch real-time updates
3. **Customize UI**: Edit React components in `react-client/src/`
4. **Extend API**: Add new endpoints in `node-server/server.js`

## Support

For issues or questions, refer to:
- `audit_report.md` - Current system status
- `implementation_plan.md` - Architecture details
- `node-server/README.md` - Node server API docs
