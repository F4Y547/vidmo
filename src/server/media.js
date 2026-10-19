import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MEDIA_DIR } from './paths.js';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);

const MIME_BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

export const MAX_UPLOAD_BYTES = Number(
  process.env.VIDMO_MAX_UPLOAD_BYTES || 250 * 1024 * 1024,
);

function safeSegment(value, label) {
  const text = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{1,96}$/.test(text)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    error.code = 'invalid_path';
    throw error;
  }
  return text;
}

export function projectMediaDir(projectId) {
  return path.join(MEDIA_DIR, safeSegment(projectId, 'project id'));
}

export function stageMediaDir(projectId, stageId) {
  return path.join(projectMediaDir(projectId), safeSegment(stageId, 'stage id'));
}

export function assetFilePath(projectId, stageId, file) {
  const filename = path.basename(String(file ?? ''));
  if (!filename || filename !== String(file) || filename.includes('..')) {
    const error = new Error('Invalid media filename');
    error.statusCode = 400;
    error.code = 'invalid_path';
    throw error;
  }
  return path.join(stageMediaDir(projectId, stageId), filename);
}

export async function ensureMediaRoot() {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
}

export async function createUploadTempPath(extension = '.bin') {
  const suffix = String(extension).startsWith('.') ? extension : `.${extension}`;
  const safeSuffix = /^\.[a-z0-9]{1,8}$/i.test(suffix) ? suffix : '.bin';
  const dir = path.join(MEDIA_DIR, '.tmp');
  await fs.mkdir(dir, { recursive: true });
  return path.join(
    dir,
    `upload-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}${safeSuffix}`,
  );
}

export function mimeFromExtension(file) {
  return MIME_BY_EXTENSION[path.extname(String(file ?? '')).toLowerCase()] || null;
}

export function isImageFile(file) {
  return IMAGE_EXTENSIONS.has(path.extname(String(file ?? '')).toLowerCase());
}

export function isVideoFile(file) {
  return VIDEO_EXTENSIONS.has(path.extname(String(file ?? '')).toLowerCase());
}

export function isMediaMime(mimeType) {
  return /^(image|video)\//i.test(String(mimeType ?? ''));
}

function startsWith(buffer, bytes) {
  if (!buffer || buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function detectMediaType(buffer, fallbackMime = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { mimeType: fallbackMime, extension: null, kind: fallbackMime.startsWith('video/') ? 'clip' : 'image' };
  }

  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', extension: '.png', kind: 'image' };
  }
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { mimeType: 'image/jpeg', extension: '.jpg', kind: 'image' };
  }
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) {
    return { mimeType: 'image/gif', extension: '.gif', kind: 'image' };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: '.webp', kind: 'image' };
  }
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    return {
      mimeType: brand === 'qt  ' ? 'video/quicktime' : 'video/mp4',
      extension: brand === 'qt  ' ? '.mov' : '.mp4',
      kind: 'clip',
    };
  }
  if (startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { mimeType: 'video/webm', extension: '.webm', kind: 'clip' };
  }
  if (fallbackMime) {
    const ext = Object.entries(MIME_BY_EXTENSION).find(([, mime]) => mime === fallbackMime)?.[0] ?? null;
    return {
      mimeType: fallbackMime,
      extension: ext,
      kind: fallbackMime.startsWith('video/') ? 'clip' : 'image',
    };
  }
  return { mimeType: 'application/octet-stream', extension: null, kind: 'image' };
}

export function imageDimensions(buffer) {
  if (!Buffer.isBuffer(buffer)) return {};
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47]) && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) break;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return {};
}

export async function readAssetBuffer(projectId, stageId, file) {
  return fs.readFile(assetFilePath(projectId, stageId, file));
}

export async function saveMediaBuffer({
  projectId,
  stageId,
  assetId,
  buffer,
  mimeType,
  kind,
}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error('Flow returned an empty media file');
    error.code = 'flow_empty_media';
    throw error;
  }
  const detected = detectMediaType(buffer, mimeType);
  if (!detected.extension) {
    const error = new Error(`Unsupported media type: ${detected.mimeType || 'unknown'}`);
    error.code = 'unsupported_media_type';
    throw error;
  }
  if (kind && detected.kind !== kind) {
    const error = new Error(`Expected a ${kind} but Flow returned ${detected.kind}`);
    error.code = 'media_kind_mismatch';
    throw error;
  }

  const directory = stageMediaDir(projectId, stageId);
  await fs.mkdir(directory, { recursive: true });
  const file = `${safeSegment(assetId, 'asset id')}${detected.extension}`;
  const target = path.join(directory, file);
  await fs.writeFile(target, buffer);
  const dimensions = detected.kind === 'image' ? imageDimensions(buffer) : {};
  return {
    file,
    mimeType: detected.mimeType,
    kind: detected.kind,
    bytes: buffer.length,
    ...dimensions,
  };
}

export async function ingestMediaFile({
  projectId,
  stageId,
  assetId,
  tempPath,
  mimeType,
  kind,
}) {
  const handle = await fs.open(tempPath, 'r');
  let header;
  let imageHeader;
  try {
    header = Buffer.alloc(64);
    await handle.read(header, 0, header.length, 0);
    if (!mimeType || mimeType === 'application/octet-stream') {
      imageHeader = header;
    }
  } finally {
    await handle.close();
  }
  const detected = detectMediaType(header, mimeType);
  if (!detected.extension) {
    const error = new Error('Upload must be a PNG, JPEG, WebP, MP4, WebM or MOV file');
    error.statusCode = 415;
    error.code = 'unsupported_media_type';
    throw error;
  }
  if (kind && detected.kind !== kind) {
    const error = new Error(`Uploaded file is not a ${kind}`);
    error.statusCode = 415;
    error.code = 'media_kind_mismatch';
    throw error;
  }

  const directory = stageMediaDir(projectId, stageId);
  await fs.mkdir(directory, { recursive: true });
  const file = `${safeSegment(assetId, 'asset id')}${detected.extension}`;
  const target = path.join(directory, file);
  try {
    await fs.rename(tempPath, target);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    await fs.copyFile(tempPath, target);
    await fs.unlink(tempPath).catch(() => {});
  }
  const stat = await fs.stat(target);
  let dimensions = {};
  if (detected.kind === 'image') {
    const buffer = await fs.readFile(target);
    dimensions = imageDimensions(buffer);
  }
  return {
    file,
    mimeType: detected.mimeType,
    kind: detected.kind,
    bytes: stat.size,
    ...dimensions,
  };
}

export async function deleteAssetFile(projectId, stageId, file) {
  try {
    await fs.unlink(assetFilePath(projectId, stageId, file));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export async function removeProjectMedia(projectId) {
  try {
    await fs.rm(projectMediaDir(projectId), { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export function mediaContentType(file) {
  return mimeFromExtension(file) || 'application/octet-stream';
}

export function isAllowedMediaFile(file) {
  const extension = path.extname(String(file ?? '')).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
}
