import express from 'express';
import multer from 'multer';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
const API_KEY = process.env.API_KEY || 'tcras_secure_key_2024';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || `${100 * 1024 * 1024}`);

const UPLOAD_DIR = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const RECEIVED_DIR = path.join(__dirname, process.env.RECEIVED_DIR || 'received_files');
const RECEIVER_REVIEW_FILE = path.join(__dirname, process.env.RECEIVER_REVIEW_FILE || 'receiver_reviews.json');
const CLOUD_DIR = path.join(__dirname, process.env.CLOUD_DIR || 'cloud_uploads');
const CLOUD_STATE_FILE = path.join(__dirname, process.env.CLOUD_STATE_FILE || 'cloud_state.json');
const DEVICE_ONLINE_MS = parseInt(process.env.DEVICE_ONLINE_MS || '45000');

for (const dir of [UPLOAD_DIR, RECEIVED_DIR, CLOUD_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

if (!fs.existsSync(CLOUD_STATE_FILE)) {
  fs.writeFileSync(CLOUD_STATE_FILE, JSON.stringify({ devices: {}, transfers: [] }, null, 2));
}
if (!fs.existsSync(RECEIVER_REVIEW_FILE)) {
  fs.writeFileSync(RECEIVER_REVIEW_FILE, JSON.stringify({ reviewed: {} }, null, 2));
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests and local tools
    if (!origin) return callback(null, true);

    const isExactAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = origin.endsWith('.vercel.app');

    if (isExactAllowed || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const id = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${id}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE }
});

const cloudUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CLOUD_DIR),
    filename: (req, file, cb) => {
      const id = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${id}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE }
});

function sanitizeDestinationHost(rawValue = '') {
  let host = String(rawValue || '').trim();
  const ipv4Match = host.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  if (ipv4Match) return ipv4Match[0];

  host = host.replace(/^https?:\/\//i, '');
  host = host.split('/')[0];
  if (host.includes(':') && !host.includes('::') && !host.startsWith('[')) {
    host = host.split(':')[0];
  }
  if (host.toLowerCase() === 'localhost') return '127.0.0.1';
  return host;
}

function sanitizeDeviceId(raw = '') {
  return String(raw || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 64);
}

function readCloudState() {
  try {
    return JSON.parse(fs.readFileSync(CLOUD_STATE_FILE, 'utf-8'));
  } catch (_) {
    return { devices: {}, transfers: [] };
  }
}

function writeCloudState(state) {
  fs.writeFileSync(CLOUD_STATE_FILE, JSON.stringify(state, null, 2));
}

function readReceiverReviewState() {
  try {
    return JSON.parse(fs.readFileSync(RECEIVER_REVIEW_FILE, 'utf-8'));
  } catch (_) {
    return { reviewed: {} };
  }
}

function writeReceiverReviewState(state) {
  fs.writeFileSync(RECEIVER_REVIEW_FILE, JSON.stringify(state, null, 2));
}

function listDirFiles(dir) {
  return fs.readdirSync(dir).map((filename) => {
    const filePath = path.join(dir, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }).sort((a, b) => new Date(b.modified) - new Date(a.modified));
}

function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function probeHostPort(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done({ connected: true }));
    socket.on('timeout', () => done({ connected: false, reason: `Timeout after ${timeoutMs}ms` }));
    socket.on('error', (err) => done({ connected: false, reason: err.message }));
    socket.connect(port, host);
  });
}

async function verifyRisk(metadata) {
  try {
    const response = await axios.post(`${PYTHON_SERVER_URL}/api/risk/check`, metadata, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Risk verification failed:', error.message);
    return {
      score: 50,
      level: 'MEDIUM',
      reason: 'AI server unreachable - proceed with caution',
      allowed: true,
      offline: true
    };
  }
}

async function sendFileToDestination(filePath, destinationIP, destinationPort = 9999) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const fileStream = fs.createReadStream(filePath);
    const timeoutMs = parseInt(process.env.TRANSFER_TIMEOUT_MS || '10000');
    let settled = false;

    const finalize = (error = null) => {
      if (settled) return;
      settled = true;
      fileStream.destroy();
      client.destroy();
      if (error) reject(error);
      else resolve({ success: true });
    };

    client.setTimeout(timeoutMs);
    client.on('timeout', () => finalize(new Error(`Transfer timeout after ${timeoutMs}ms. Verify receiver is listening on ${destinationIP}:${destinationPort}`)));

    client.connect(destinationPort, destinationIP, () => {
      const metadata = {
        filename: path.basename(filePath),
        size: fs.statSync(filePath).size
      };
      client.write(JSON.stringify(metadata) + '\n');
      fileStream.pipe(client);
    });

    fileStream.on('end', () => client.end());
    client.on('error', (err) => finalize(new Error(`Connection failed to ${destinationIP}:${destinationPort} - ${err.message}`)));
    fileStream.on('error', (err) => finalize(err));
    client.on('close', (hadError) => { if (!hadError) finalize(); });
  });
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TCRAS Transfer Server',
    pythonServer: PYTHON_SERVER_URL,
    timestamp: new Date().toISOString()
  });
});

// LAN upload + risk
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const destinationIP = sanitizeDestinationHost(req.body?.destinationIP);
    if (!destinationIP) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Destination IP is required' });
    }

    const fileHash = await calculateFileHash(req.file.path);
    const riskResult = await verifyRisk({
      filename: req.file.originalname,
      source_ip: req.ip || '127.0.0.1',
      destination_ip: destinationIP,
      file_size_bytes: req.file.size
    });

    res.json({
      success: true,
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        hash: fileHash,
        path: req.file.path
      },
      risk: riskResult,
      message: riskResult.allowed ? 'File verified. Ready to transfer.' : 'Transfer blocked by security policy.'
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// LAN transfer
app.post('/api/transfer', async (req, res) => {
  try {
    const { filePath, destinationPort } = req.body;
    const destinationIP = sanitizeDestinationHost(req.body?.destinationIP);

    if (!filePath || !destinationIP) return res.status(400).json({ error: 'File path and destination IP are required' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    await sendFileToDestination(filePath, destinationIP, Number(destinationPort) || 9999);
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File transferred successfully', destination: destinationIP });
  } catch (error) {
    res.status(502).json({ error: 'Transfer failed', message: error.message });
  }
});

// LAN receiver probe + files
app.post('/api/receiver/connect', async (req, res) => {
  const targetIP = sanitizeDestinationHost(req.body?.targetIP || req.body?.ip || req.body?.destinationIP);
  const targetPort = Number(req.body?.targetPort || req.body?.port || 9999);
  if (!targetIP) return res.status(400).json({ error: 'Target IP is required' });

  const result = await probeHostPort(targetIP, targetPort);
  res.json({ targetIP, targetPort, connected: result.connected, reason: result.reason || null });
});

app.get('/api/receiver/status', async (req, res) => {
  const targetIP = sanitizeDestinationHost(req.query?.targetIP || req.query?.ip || '');
  const targetPort = Number(req.query?.targetPort || req.query?.port || 9999);
  if (!targetIP) return res.status(400).json({ error: 'Target IP is required' });

  const result = await probeHostPort(targetIP, targetPort);
  res.json({ targetIP, targetPort, connected: result.connected, reason: result.reason || null });
});

app.get('/api/receiver/files', (req, res) => {
  try {
    const reviewState = readReceiverReviewState();
    const files = listDirFiles(RECEIVED_DIR).map((file) => ({
      ...file,
      reviewed: Boolean(reviewState.reviewed[file.filename])
    }));
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list received files', message: error.message });
  }
});

app.get('/api/receiver/download/:filename', (req, res) => {
  const filename = path.basename(String(req.params.filename || ''));
  if (!filename) return res.status(400).json({ error: 'filename is required' });

  const filePath = path.join(RECEIVED_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.sendFile(filePath);
});

app.post('/api/receiver/review', (req, res) => {
  const filename = path.basename(String(req.body?.filename || ''));
  const reviewed = Boolean(req.body?.reviewed);
  if (!filename) return res.status(400).json({ error: 'filename is required' });

  const filePath = path.join(RECEIVED_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  const state = readReceiverReviewState();
  state.reviewed = state.reviewed || {};
  state.reviewed[filename] = reviewed;
  writeReceiverReviewState(state);

  res.json({ success: true, filename, reviewed });
});

app.get('/api/uploads', (req, res) => {
  try {
    res.json({ files: listDirFiles(UPLOAD_DIR) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cloud relay endpoints
app.post('/api/cloud/devices/register', (req, res) => {
  const deviceId = sanitizeDeviceId(req.body?.deviceId);
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });

  const state = readCloudState();
  state.devices[deviceId] = { deviceId, lastSeen: new Date().toISOString() };
  writeCloudState(state);
  res.json({ success: true, deviceId, registered: true });
});

app.post('/api/cloud/devices/heartbeat', (req, res) => {
  const deviceId = sanitizeDeviceId(req.body?.deviceId);
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });

  const state = readCloudState();
  state.devices[deviceId] = {
    ...(state.devices[deviceId] || { deviceId }),
    lastSeen: new Date().toISOString()
  };
  writeCloudState(state);
  res.json({ success: true, deviceId });
});

app.get('/api/cloud/devices/:deviceId/status', (req, res) => {
  const deviceId = sanitizeDeviceId(req.params.deviceId);
  const state = readCloudState();
  const device = state.devices[deviceId];
  if (!device) return res.json({ deviceId, online: false, reason: 'Device not registered' });

  const ageMs = Date.now() - new Date(device.lastSeen).getTime();
  res.json({ deviceId, online: ageMs <= DEVICE_ONLINE_MS, lastSeen: device.lastSeen });
});

app.post('/api/cloud/upload', cloudUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const senderId = sanitizeDeviceId(req.body?.senderId);
    const receiverId = sanitizeDeviceId(req.body?.receiverId);
    if (!senderId || !receiverId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    const transferId = crypto.randomUUID();
    const fileHash = await calculateFileHash(req.file.path);
    const riskResult = await verifyRisk({
      filename: req.file.originalname,
      source_ip: senderId || 'cloud-sender',
      destination_ip: receiverId || 'cloud-receiver',
      file_size_bytes: req.file.size
    });

    if (!riskResult.allowed) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: 'Transfer blocked by security policy',
        risk: riskResult
      });
    }

    const state = readCloudState();
    state.transfers.push({
      transferId,
      senderId,
      receiverId,
      originalName: req.file.originalname,
      storageName: path.basename(req.file.path),
      size: req.file.size,
      hash: fileHash,
      createdAt: new Date().toISOString(),
      deliveredAt: null
    });
    writeCloudState(state);

    res.json({
      success: true,
      transferId,
      file: { originalName: req.file.originalname, size: req.file.size, hash: fileHash },
      risk: riskResult
    });
  } catch (error) {
    res.status(500).json({ error: 'Cloud upload failed', message: error.message });
  }
});

app.get('/api/cloud/inbox/:deviceId', (req, res) => {
  const deviceId = sanitizeDeviceId(req.params.deviceId);
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });

  const state = readCloudState();
  const files = state.transfers
    .filter((t) => t.receiverId === deviceId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((t) => ({
      transferId: t.transferId,
      senderId: t.senderId,
      receiverId: t.receiverId,
      filename: t.originalName,
      size: t.size,
      hash: t.hash,
      createdAt: t.createdAt,
      deliveredAt: t.deliveredAt,
      downloadUrl: `/api/cloud/download/${t.transferId}`
    }));

  res.json({ deviceId, files });
});

app.get('/api/cloud/download/:transferId', (req, res) => {
  const transferId = String(req.params.transferId || '');
  const state = readCloudState();
  const transfer = state.transfers.find((t) => t.transferId === transferId);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  const filePath = path.join(CLOUD_DIR, transfer.storageName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found in storage' });

  res.setHeader('Content-Disposition', `attachment; filename="${transfer.originalName}"`);
  return res.sendFile(filePath);
});

app.post('/api/cloud/ack/:transferId', (req, res) => {
  const transferId = String(req.params.transferId || '');
  const state = readCloudState();
  const index = state.transfers.findIndex((t) => t.transferId === transferId);
  if (index === -1) return res.status(404).json({ error: 'Transfer not found' });

  state.transfers[index].deliveredAt = new Date().toISOString();
  writeCloudState(state);
  res.json({ success: true, transferId, deliveredAt: state.transfers[index].deliveredAt });
});

app.listen(PORT, () => {
  console.log('TCRAS server running on port', PORT);
});

process.on('SIGINT', () => process.exit(0));
