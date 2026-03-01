# TCRAS Node.js Transfer Server

Express.js server that handles file uploads and LAN transfers with AI-powered risk verification.

## Features

- 📤 File upload via multipart/form-data
- 🔍 Risk verification via Python AI server
- 🌐 LAN file transfer over TCP sockets
- 🔐 API key authentication
- 📊 Upload history tracking

## Prerequisites

- Node.js 18+ and npm
- Python TCRAS server running on port 8000

## Installation

```bash
cd node-server
npm install
```

## Configuration

Edit `.env` file:

```env
PYTHON_SERVER_URL=http://localhost:8000
API_KEY=tcras_secure_key_2024
PORT=5000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Usage

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "TCRAS Transfer Server",
  "pythonServer": "http://localhost:8000",
  "timestamp": "2026-02-09T12:30:00.000Z"
}
```

### `POST /api/upload`
Upload file and get risk assessment.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: File to upload
  - `destinationIP`: Target IP address

**Response:**
```json
{
  "success": true,
  "file": {
    "originalName": "document.pdf",
    "size": 1024000,
    "hash": "abc123...",
    "path": "/uploads/file-123456.pdf"
  },
  "risk": {
    "score": 25.5,
    "level": "LOW",
    "reason": "Standard traffic pattern",
    "allowed": true
  },
  "message": "File verified. Ready to transfer."
}
```

### `POST /api/transfer`
Execute file transfer to destination.

**Request:**
```json
{
  "filePath": "/uploads/file-123456.pdf",
  "destinationIP": "192.168.1.100",
  "destinationPort": 9999
}
```

**Response:**
```json
{
  "success": true,
  "message": "File transferred successfully",
  "destination": "192.168.1.100"
}
```

### `GET /api/uploads`
List all uploaded files.

**Response:**
```json
{
  "files": [
    {
      "filename": "file-123456.pdf",
      "size": 1024000,
      "created": "2026-02-09T12:00:00.000Z",
      "modified": "2026-02-09T12:00:00.000Z"
    }
  ]
}
```

## Architecture

```
Client (React)
    ↓ POST /api/upload
Node.js Server
    ↓ POST /api/risk/check
Python AI Server (Isolation Forest)
    ↓ Risk Decision
Node.js Server
    ↓ (if allowed)
Destination Device (TCP Socket)
```

## Error Handling

- **400 Bad Request**: Missing required fields
- **404 Not Found**: File not found
- **500 Internal Server Error**: Server error or Python AI server unreachable

When Python AI server is offline, the system returns a cautious MEDIUM risk assessment with `offline: true` flag.

## Security

- API key authentication for Python server communication
- CORS protection (configurable origins)
- File size limits (default 100MB)
- Automatic file cleanup after transfer
