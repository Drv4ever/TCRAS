import net from 'net';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const HOST = process.env.RECEIVER_HOST || '0.0.0.0';
const PORT = Number(process.env.RECEIVER_PORT || 9999);
const SAVE_DIR = path.join(__dirname, process.env.RECEIVED_DIR || 'received_files');

if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

const server = net.createServer((socket) => {
  let metadataParsed = false;
  let headerBuffer = Buffer.alloc(0);
  let writeStream = null;
  let remainingBytes = 0;
  let outputPath = null;

  socket.on('data', (chunk) => {
    if (!metadataParsed) {
      headerBuffer = Buffer.concat([headerBuffer, chunk]);
      const nlIndex = headerBuffer.indexOf('\n');

      if (nlIndex === -1) return;

      const metadataLine = headerBuffer.slice(0, nlIndex).toString('utf-8').trim();
      const remainder = headerBuffer.slice(nlIndex + 1);
      headerBuffer = Buffer.alloc(0);

      try {
        const meta = JSON.parse(metadataLine);
        const filename = path.basename(meta.filename || `received-${Date.now()}.bin`);
        const size = Number(meta.size || 0);

        if (!Number.isFinite(size) || size < 0) {
          throw new Error('Invalid file size in metadata');
        }

        outputPath = path.join(SAVE_DIR, filename);
        writeStream = fs.createWriteStream(outputPath);
        remainingBytes = size;
        metadataParsed = true;

        console.log(`Receiving ${filename} (${size} bytes) from ${socket.remoteAddress}`);

        if (remainder.length > 0) {
          const bytesToWrite = remainder.slice(0, remainingBytes);
          writeStream.write(bytesToWrite);
          remainingBytes -= bytesToWrite.length;
        }

        if (remainingBytes === 0) {
          writeStream.end();
          console.log(`Saved: ${outputPath}`);
          socket.end();
        }
      } catch (error) {
        console.error('Invalid metadata received:', error.message);
        socket.destroy();
      }
      return;
    }

    if (!writeStream) return;

    const bytesToWrite = chunk.slice(0, remainingBytes);
    writeStream.write(bytesToWrite);
    remainingBytes -= bytesToWrite.length;

    if (remainingBytes === 0) {
      writeStream.end();
      console.log(`Saved: ${outputPath}`);
      socket.end();
    }
  });

  socket.on('error', (error) => {
    console.error('Receiver socket error:', error.message);
    if (writeStream) writeStream.destroy();
  });

  socket.on('close', () => {
    if (remainingBytes > 0) {
      console.error(`Connection closed early. Missing ${remainingBytes} bytes.`);
      if (writeStream) writeStream.destroy();
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   TCRAS Receiver                                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`Listening on ${HOST}:${PORT}`);
  console.log(`Saving files to: ${SAVE_DIR}`);
});

process.on('SIGINT', () => {
  console.log('\nStopping receiver...');
  server.close(() => process.exit(0));
});
