import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = process.env.VIDMO_DATA_DIR
  ? path.resolve(process.env.VIDMO_DATA_DIR)
  : path.join(ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_STORE = {
  version: 1,
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

async function writeStoreFile(store) {
  await ensureStore();
  const temp = `${STORE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(store, null, 2), 'utf8');
  await fs.rename(temp, STORE_FILE);
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
