# API Reference

## Base URL
`http://localhost:8000/api`

## Authentication
All write operations (`POST`) require an API Key.
*   **Header**: `X-API-Key: <your_secret_key>`
*   **Config**: key is defined in `config.yaml`.

## Endpoints

### 1. Submit File Event
**POST** `/file-event`

**Description**: Receives file metadata from the Agent.

**Request Body (JSON)**:
```json
{
  "filename": "document.pdf",
  "file_hash": "sha256_hash_string",
  "file_size_bytes": 1024,
  "source_ip": "192.168.1.5",
  "destination_ip": "192.168.1.10",
  "source_user": "admin",
  "timestamp": "ISO_8601_TIMESTAMP",
  "event_type": "created"
}
```

**Response**:
```json
{
  "status": "received",
  "risk": [85.5, "HIGH", "Abnormal chain length"]
}
```

### 2. Dashboard Stream
**GET** `/stream`

**Description**: Server-Sent Events (SSE) endpoint for real-time dashboard updates.
**Format**: `text/event-stream`

### 3. Graph Data
**GET** `/graph-data`

**Description**: Returns current network graph snapshot.
**Response**:
```json
{
  "nodes": [{"id": "IP1"}, {"id": "IP2"}],
  "links": [{"source": "IP1", "target": "IP2"}]
}
```
