import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..', '..');

function resolveFromEnv(name, fallback) {
  const value = process.env[name];
  return value ? path.resolve(value) : fallback;
}

export const DATA_DIR = resolveFromEnv('VIDMO_DATA_DIR', path.join(ROOT, 'data'));
export const STORE_FILE = path.join(DATA_DIR, 'store.json');
export const MEDIA_DIR = resolveFromEnv('VIDMO_MEDIA_DIR', path.join(DATA_DIR, 'media'));
export const FLOW_DIR = resolveFromEnv('VIDMO_FLOW_DIR', path.join(DATA_DIR, 'flow'));
export const FLOW_PROFILE_DIR = resolveFromEnv(
  'VIDMO_FLOW_PROFILE_DIR',
  path.join(DATA_DIR, 'flow-profile'),
);

export function relativeDataPath(target) {
  const relative = path.relative(ROOT, target);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return relative.replace(/\\/g, '/');
  }
  return target.replace(/\\/g, '/');
}
