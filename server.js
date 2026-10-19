import http from 'node:http';
import process from 'node:process';

try {
  process.loadEnvFile?.();
} catch (error) {
  if (error?.code !== 'ENOENT') {
    console.warn(`[VidMo] Could not load .env: ${error.message}`);
  }
}

const { handleRequest } = await import('./src/server/app.js');
const { dataFileLocation } = await import('./src/server/store.js');

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

const server = http.createServer(handleRequest);

server.on('error', (error) => {
  console.error(`[VidMo] Server error: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log('');
  console.log('  VidMo Studio — miniature cooking production system');
  console.log(`  ➜  http://${host}:${port}`);
  console.log(`  ➜  Data: ${dataFileLocation()}`);
  console.log('');
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
