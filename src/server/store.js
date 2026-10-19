import { promises as fs } from 'node:fs';
import { DATA_DIR, STORE_FILE } from './paths.js';

const DEFAULT_STORE = {
  version: 2,
  settings: {
    defaultVideoModel: 'Google Veo 3.1',
  },
  projects: [],
};

let writeQueue = Promise.resolve();

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
  }
}

async function readStoreFile() {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, 'utf8');
  try {
    const store = JSON.parse(raw);
    return {
      ...DEFAULT_STORE,
      ...store,
      settings: { ...DEFAULT_STORE.settings, ...(store.settings ?? {}) },
      projects: Array.isArray(store.projects) ? store.projects : [],
    };
  } catch (error) {
    throw new Error(`The VidMo data store is corrupted: ${error.message}`);
  }
}

// Windows can briefly lock the store file (antivirus, indexer, another local
// process), which surfaces as a transient rename failure. Retry those instead
// of failing a generation job over a momentary lock.
const TRANSIENT_RENAME_ERRORS = new Set(['EPERM', 'EBUSY', 'EACCES']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renameWithRetry(source, target, attempts = 6) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fs.rename(source, target);
      return;
    } catch (error) {
      lastError = error;
      if (!TRANSIENT_RENAME_ERRORS.has(error?.code)) throw error;
      await sleep(25 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function writeStoreFile(store) {
  await ensureStore();
  const temp = `${STORE_FILE}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(temp, JSON.stringify(store, null, 2), 'utf8');
    await renameWithRetry(temp, STORE_FILE);
  } finally {
    await fs.rm(temp, { force: true }).catch(() => {});
  }
}

export async function readStore() {
  return readStoreFile();
}

export function transact(fn) {
  const run = writeQueue.then(async () => {
    const store = await readStoreFile();
    const result = await fn(store);
    await writeStoreFile(store);
    return result;
  });
  writeQueue = run.catch(() => {});
  return run;
}

export async function getStoreStats() {
  const store = await readStoreFile();
  return {
    projects: store.projects.length,
    dataFile: STORE_FILE,
  };
}

export function dataFileLocation() {
  return STORE_FILE;
}
