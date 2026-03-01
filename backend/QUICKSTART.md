# TCRAS - Quick Start Guide

## 🚀 Option 1: React + Node.js Web Interface (Recommended)

### Prerequisites
- ✅ Python 3.13+ (you have this)
- ❌ **Node.js 18+** (you need to install this)

### Install Node.js
1. Download from: https://nodejs.org/
2. Install **Node.js 18 LTS** (recommended)
3. Restart your terminal/command prompt
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Run Web Interface
```bash
python scripts/run_all_web.py
```

Then open: **http://localhost:3000**

---

## 🖥️ Option 2: Tkinter Desktop Client (No Node.js Required)

If you don't want to install Node.js, you can use the existing Tkinter clients:

### Standalone Transfer Client
```bash
python client_transfer_only.py
```

### Integrated Transfer App
```bash
python src/transfer_app/main.py
```

### Monitor Dashboard (HTML)
1. Start Python server:
   ```bash
   python scripts/run_server.py
   ```
2. Open browser: **http://localhost:8000**

---

## 📊 What's the Difference?

| Feature | React + Node | Tkinter |
|---------|--------------|---------|
| **UI** | Modern web interface | Desktop application |
| **Installation** | Requires Node.js | Python only |
| **File Upload** | Drag-and-drop | File browser |
| **Dashboard** | Real-time web dashboard | HTML dashboard |
| **Risk Display** | Animated badges | Dialog boxes |
| **Platform** | Any browser | Windows only |

**Both use the same Python AI engine (Isolation Forest + NetworkX)**

---

## ⚡ Quick Test (Python Only)

To test the AI engine without Node.js:

```bash
# Terminal 1: Start Python server
python scripts/run_server.py

# Terminal 2: Use Tkinter client
python client_transfer_only.py
```

---

## 🆘 Troubleshooting

### "Node.js not found"
- Install Node.js from https://nodejs.org/
- Restart terminal after installation
- Or use Tkinter client (Option 2)

### "Python server not running"
```bash
python scripts/run_server.py
```

### "Port already in use"
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

---

## 📖 Full Documentation

- **Setup Guide**: `docs/REACT_SETUP.md`
- **Audit Report**: See artifacts in conversation
- **Walkthrough**: See artifacts in conversation
