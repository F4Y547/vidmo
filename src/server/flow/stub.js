import { deflateSync } from 'node:zlib';

const IMAGE_DELAY = Number(process.env.VIDMO_FLOW_STUB_DELAY_MS || 450);
const CLIP_DELAY = Number(process.env.VIDMO_FLOW_STUB_CLIP_DELAY_MS || 850);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  name.copy(header, 4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([header, data, crc]);
}

function stubSize() {
  const configured = process.env.VIDMO_FLOW_STUB_SIZE;
  if (configured && /^\d+x\d+$/.test(configured)) {
    const [width, height] = configured.split('x').map(Number);
    if (width >= 16 && height >= 16 && width <= 2160 && height <= 3840) return { width, height };
  }
  return { width: 540, height: 960 };
}

function hueFrom(text) {
  let hash = 0;
  for (const character of String(text ?? '')) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % 360;
}

function hslToRgb(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = hue / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const match = l - chroma / 2;
  let rgb;
  if (section < 1) rgb = [chroma, x, 0];
  else if (section < 2) rgb = [x, chroma, 0];
  else if (section < 3) rgb = [0, chroma, x];
  else if (section < 4) rgb = [0, x, chroma];
  else if (section < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];
  return rgb.map((value) => Math.round((value + match) * 255));
}

export function createStubPng({ width, height, label = '' }) {
  const hue = hueFrom(label);
  const accent = hslToRgb((hue + 36) % 360, 62, 58);
  const deep = hslToRgb(hue, 48, 12);
  const warm = hslToRgb((hue + 320) % 360, 42, 26);
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const cx = width * 0.5;
  const cy = height * 0.44;
  const radius = Math.min(width, height) * 0.3;

  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = row + 1 + x * 4;
      const nx = x / width;
      const ny = y / height;
      const distance = Math.hypot(x - cx, y - cy);
      const glow = Math.max(0, 1 - distance / radius);
      const vignette = 1 - Math.min(1, Math.hypot(nx - 0.5, ny - 0.5) * 1.25);
      const blend = 0.18 + 0.6 * (1 - ny) + glow * 0.35;
      raw[offset] = Math.min(255, Math.round(deep[0] + (warm[0] - deep[0]) * blend + accent[0] * glow * 0.16));
      raw[offset + 1] = Math.min(
        255,
        Math.round(deep[1] + (warm[1] - deep[1]) * blend + accent[1] * glow * 0.16),
      );
      raw[offset + 2] = Math.min(
        255,
        Math.round(deep[2] + (warm[2] - deep[2]) * blend + accent[2] * glow * 0.16),
      );
      raw[offset + 3] = Math.round(150 + 90 * vignette);
      if (glow > 0.82 && distance < radius * 0.9) {
        raw[offset] = Math.min(255, raw[offset] + 24);
        raw[offset + 1] = Math.min(255, raw[offset + 1] + 18);
        raw[offset + 2] = Math.min(255, raw[offset + 2] + 8);
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function stubGenerateImage({ prompt = '', stageLabel = '', onProgress } = {}) {
  const { width, height } = stubSize();
  onProgress?.('Simulator: painting a placeholder stage image…');
  if (IMAGE_DELAY > 0) await sleep(IMAGE_DELAY);
  onProgress?.('Simulator: placeholder image ready.');
  return {
    buffer: createStubPng({ width, height, label: `${stageLabel}:${prompt.slice(0, 80)}` }),
    mimeType: 'image/png',
    modelLabel: 'VidMo Flow Simulator',
    warnings: [
      'Placeholder media from the built-in simulator. Connect a real Google Flow session for actual generations.',
    ],
    stub: true,
  };
}

export async function stubGenerateClip({ prompt = '', stageLabel = '', onProgress } = {}) {
  onProgress?.('Simulator: preparing a placeholder clip…');
  if (CLIP_DELAY > 0) await sleep(CLIP_DELAY);
  const ftyp = Buffer.alloc(24);
  ftyp.writeUInt32BE(24, 0);
  ftyp.write('ftyp', 4, 'ascii');
  ftyp.write('isom', 8, 'ascii');
  ftyp.writeUInt32BE(512, 12);
  ftyp.write('isomiso2avc1mp41', 16, 'ascii');
  const marker = Buffer.from(
    `VidMo simulated clip\n${stageLabel}\n${String(prompt).slice(0, 500)}\n`,
    'utf8',
  );
  const mdat = Buffer.alloc(8 + marker.length + 2048);
  mdat.writeUInt32BE(mdat.length, 0);
  mdat.write('mdat', 4, 'ascii');
  marker.copy(mdat, 8);
  onProgress?.('Simulator: placeholder clip ready.');
  return {
    buffer: Buffer.concat([ftyp, mdat]),
    mimeType: 'video/mp4',
    modelLabel: 'VidMo Flow Simulator',
    warnings: [
      'Placeholder clip from the built-in simulator. It is not playable video; connect Google Flow for real clips.',
    ],
    stub: true,
  };
}
