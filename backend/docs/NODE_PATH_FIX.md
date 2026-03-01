# Node.js PATH Fix Guide

## Problem
Node.js is installed but `npm` is not found in your system PATH.

## Quick Fix

### Option 1: Restart Terminal (Easiest)
1. Close all terminal/command prompt windows
2. Open a new terminal
3. Try again:
   ```bash
   python scripts/run_all_web.py
   ```

### Option 2: Add Node.js to PATH Manually

1. Find your Node.js installation directory:
   - Default: `C:\Program Files\nodejs\`
   - Or: `C:\Program Files (x86)\nodejs\`

2. Add to PATH:
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\nodejs\`
   - Click OK on all dialogs

3. Restart terminal and try again

### Option 3: Use Full Path to npm

Edit `node-server\.env` and add:
```env
NPM_PATH=C:\Program Files\nodejs\npm.cmd
```

Then modify the launcher to use this path.

## Verify Installation

Open a **new** terminal and run:
```bash
node --version
npm --version
```

Both should show version numbers.

## Alternative: Use Python-Only Version

If you don't want to fix Node.js PATH:

```bash
# Start Python server + dashboard
python scripts/run_python_only.py

# In another terminal, run transfer client
python client_transfer_only.py
```

This works immediately without Node.js!
