import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

// Keep the mock test isolated from the real data directory and from any
// selectors.json overrides the user may have added.
process.env.VIDMO_DATA_DIR = path.join(
  os.tmpdir(),
  `vidmo-flow-mock-${process.pid}-${Date.now()}`,
);
process.env.VIDMO_FLOW_IMAGE_TIMEOUT_MS = '20000';
process.env.VIDMO_FLOW_VIDEO_TIMEOUT_MS = '20000';
delete process.env.VIDMO_FLOW_IMAGE_MODEL;
delete process.env.VIDMO_FLOW_VIDEO_MODEL;

const { generateImage, generateVideo } = await import('../src/server/flow/automation.js');
const { installedBrowser } = await import('../src/server/flow/session.js');

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const IMAGE_DATA_URL = `data:image/png;base64,${PNG_BYTES.toString('base64')}`;
const VIDEO_BYTES = Buffer.from('vidmo-mock-mp4-payload');
const VIDEO_DATA_URL = `data:video/mp4;base64,${VIDEO_BYTES.toString('base64')}`;

/**
 * A deliberately small mock of Flow's generation workspace. It implements the
 * accessible surface the automation relies on: a textarea prompt field, a
 * model switcher with Image/Video menu options, a 9:16 button, a hidden
 * start-frame file input and a Generate button that appends a media element.
 */
function mockFlowHtml(mode) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Mock Flow</title></head>
  <body>
    <h1>Flow workspace (mock)</h1>
    <button id="model">Nano Banana Pro</button>
    <div id="menu" hidden>
      <button role="menuitem" data-kind="image">Image</button>
      <button role="menuitem" data-kind="video">Video</button>
    </div>
    <button id="aspect">9:16</button>
    <textarea id="prompt" placeholder="Describe your shot"></textarea>
    <button id="generate">Generate</button>
    <input id="frame" type="file" accept="image/*" hidden />
    <div id="results"></div>
    <script>
      const MODE = ${JSON.stringify(mode)};
      const IMAGE = ${JSON.stringify(IMAGE_DATA_URL)};
      const VIDEO = ${JSON.stringify(VIDEO_DATA_URL)};
      const model = document.getElementById('model');
      const menu = document.getElementById('menu');
      model.addEventListener('click', () => { menu.hidden = false; });
      menu.querySelectorAll('button').forEach((option) => {
        option.addEventListener('click', () => {
          menu.hidden = true;
          model.textContent = option.dataset.kind === 'video' ? 'Veo 3.1' : 'Nano Banana Pro';
        });
      });
      document.getElementById('generate').addEventListener('click', () => {
        const results = document.getElementById('results');
        if (MODE === 'image') {
          const img = document.createElement('img');
          img.src = IMAGE;
          img.width = 360;
          img.height = 540;
          img.style.width = '360px';
          img.style.height = '540px';
          img.alt = 'mock flow image';
          results.appendChild(img);
        } else {
          const video = document.createElement('video');
          video.src = VIDEO;
          video.setAttribute('poster', IMAGE);
          video.width = 360;
          video.height = 540;
          video.style.width = '360px';
          video.style.height = '540px';
          results.appendChild(video);
        }
      });
    </script>
  </body>
</html>`;
}

function startMockServer(mode) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(mockFlowHtml(mode));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}/` });
    });
  });
}

async function launchBrowser(t) {
  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    return null;
  }
  const info = await installedBrowser();
  const attempts = [];
  if (info?.executablePath) attempts.push({ headless: true, executablePath: info.executablePath });
  attempts.push({ headless: true, channel: 'chrome' });
  attempts.push({ headless: true, channel: 'msedge' });
  for (const options of attempts) {
    try {
      const browser = await chromium.launch(options);
      t.after(() => browser.close().catch(() => {}));
      return browser;
    } catch {
      /* try the next browser */
    }
  }
  return null;
}

function mockSession(page) {
  return {
    mode: 'browser',
    page,
    setStatus() {},
    async ensureReady() {},
    async runExclusive(task) {
      return task();
    },
    async startProject() {},
    async waitForManual() {},
    async requestAttention() {},
    async screenshot() {
      return null;
    },
    async captureDiagnostics() {
      return null;
    },
  };
}

test('mock Flow: generateImage writes the prompt and returns the new image bytes', async (t) => {
  const { server, base } = await startMockServer('image');
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const browser = await launchBrowser(t);
  if (!browser) {
    t.skip('Chrome/Edge or playwright-core not available; mock Flow test skipped.');
    return;
  }

  const page = await browser.newPage();
  t.after(() => page.close().catch(() => {}));
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  const progress = [];
  const result = await generateImage({
    session: mockSession(page),
    prompt:
      'Extreme macro cinematic shot of a tiny cheeseburger on a miniature wooden board, giant hands nearby, 1:12 scale, shallow depth of field.',
    projectId: 'mock-project',
    projectTitle: 'Mock project',
    stageLabel: 'S1',
    onProgress: (message) => progress.push(message),
  });

  assert.equal(result.mimeType, 'image/png');
  assert.ok(result.buffer.equals(PNG_BYTES), 'image bytes should round-trip unchanged');
  assert.equal(result.mode, 'image');
  assert.equal(result.aspectApplied, true);
  assert.ok(result.promptLength > 40, 'the prompt should be written into the Flow field');
  assert.ok(progress.length > 0, 'Flow should report progress messages');

  const promptValue = await page.inputValue('#prompt');
  assert.match(promptValue, /Extreme macro cinematic shot/);
});

test('mock Flow: generateVideo uploads the approved image and returns the clip bytes', async (t) => {
  const { server, base } = await startMockServer('video');
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const browser = await launchBrowser(t);
  if (!browser) {
    t.skip('Chrome/Edge or playwright-core not available; mock Flow test skipped.');
    return;
  }

  const page = await browser.newPage();
  t.after(() => page.close().catch(() => {}));
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  const imagePath = path.join(os.tmpdir(), `vidmo-mock-frame-${process.pid}-${Date.now()}.png`);
  await fs.writeFile(imagePath, PNG_BYTES);
  t.after(() => fs.rm(imagePath, { force: true }).catch(() => {}));

  const result = await generateVideo({
    session: mockSession(page),
    prompt:
      'Match the stage. Slow macro push-in on the tiny cheeseburger. Only realistic ASMR: no music, no voice.',
    startImagePath: imagePath,
    projectId: 'mock-project',
    projectTitle: 'Mock project',
    stageLabel: 'S1',
  });

  assert.equal(result.mimeType, 'video/mp4');
  assert.ok(result.buffer.equals(VIDEO_BYTES), 'clip bytes should round-trip unchanged');
  assert.equal(result.mode, 'video');
  assert.equal(result.aspectApplied, true);

  const upload = await page.evaluate(() => {
    const input = document.getElementById('frame');
    return {
      count: input?.files?.length ?? 0,
      name: input?.files?.[0]?.name ?? '',
    };
  });
  assert.equal(upload.count, 1, 'the approved image should be attached as the start frame');
  assert.match(upload.name, /\.png$/);
});
