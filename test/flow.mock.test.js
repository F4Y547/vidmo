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
process.env.VIDMO_FLOW_TYPE_DELAY_MS = '0';
process.env.VIDMO_FLOW_POLL_MS = '100';
process.env.VIDMO_FLOW_ABUSE_GRACE_MS = '1200';
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
const ABUSE_TEXT =
  'We noticed some unusual activity. Note that browser extensions that modify the page may cause issues. Please visit the Help Centre for more information. You have not been charged for this generation.';

function mockFlowHtml(
  mode,
  { existingFailures = 0, failOnGenerate = false, maxFailures = Infinity } = {},
) {
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
      const ABUSE = ${JSON.stringify(ABUSE_TEXT)};
      const EXISTING_FAILURES = ${Number(existingFailures)};
      const FAIL_ON_GENERATE = ${Boolean(failOnGenerate)};
      const MAX_FAILURES = ${Number.isFinite(maxFailures) ? Number(maxFailures) : 'Infinity'};
      const results = document.getElementById('results');

      function addFailureCard() {
        // A full grid drops its oldest card, so the DOM count stays the same
        // even though a new generation just failed.
        if (results.querySelectorAll('section').length >= MAX_FAILURES) {
          results.querySelector('section')?.remove();
        }
        const card = document.createElement('section');
        const status = document.createElement('span');
        status.textContent = 'Failed';
        const detail = document.createElement('span');
        detail.textContent = ABUSE;
        const retry = document.createElement('button');
        retry.textContent = 'Retry';
        card.append(status, detail, retry);
        results.appendChild(card);
      }

      for (let index = 0; index < EXISTING_FAILURES; index += 1) addFailureCard();

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
        if (FAIL_ON_GENERATE) {
          addFailureCard();
          return;
        }
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

/**
 * The October 2026 Flow composer: a ProseMirror prompt, a "Settings trigger"
 * card with radio options (Image/Video, aspect ratio, output count) and a
 * "Start generation" submit button.
 */
function mockFlowV2Html() {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Mock Flow 2026</title></head>
  <body>
    <button aria-label="Settings trigger" id="settingsTrigger">🍌 Nano Banana 2.1 x2</button>
    <div id="settings" hidden>
      <button role="radio" aria-checked="true" data-group="mode">image Image</button>
      <button role="radio" aria-checked="false" data-group="mode">videocam Video</button>
      <button role="radio" aria-checked="true" data-group="aspect">crop_16_9 16:9</button>
      <button role="radio" aria-checked="false" data-group="aspect">crop_9_16 9:16</button>
      <button role="radio" aria-checked="false" data-group="count">x1</button>
      <button role="radio" aria-checked="true" data-group="count">x2</button>
    </div>
    <div id="prompt" contenteditable="true" role="textbox" class="ProseMirror"></div>
    <button type="submit" id="generate">Start generation</button>
    <div id="results"></div>
    <script>
      const IMAGE = ${JSON.stringify(IMAGE_DATA_URL)};
      const trigger = document.getElementById('settingsTrigger');
      const settings = document.getElementById('settings');
      trigger.addEventListener('click', () => { settings.hidden = !settings.hidden; });
      settings.querySelectorAll('button[role="radio"]').forEach((radio) => {
        radio.addEventListener('click', () => {
          settings
            .querySelectorAll('button[data-group="' + radio.dataset.group + '"]')
            .forEach((peer) => peer.setAttribute('aria-checked', String(peer === radio)));
          const aspect = settings.querySelector('button[data-group="aspect"][aria-checked="true"]');
          const count = settings.querySelector('button[data-group="count"][aria-checked="true"]');
          trigger.textContent = '🍌 Nano Banana 2.1 ' + (count?.textContent ?? 'x1') + ' ' + (aspect?.textContent ?? '');
        });
      });
      document.getElementById('generate').addEventListener('click', () => {
        const img = document.createElement('img');
        img.src = IMAGE;
        img.width = 360;
        img.height = 540;
        img.style.width = '360px';
        img.style.height = '540px';
        img.alt = 'mock flow 2026 image';
        document.getElementById('results').appendChild(img);
      });
    </script>
  </body>
</html>`;
}

function startMockServer(mode, html = mockFlowHtml(mode)) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
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

test('mock Flow: stale failure cards do not fail a new successful image', async (t) => {
  const { server, base } = await startMockServer(
    'image',
    mockFlowHtml('image', { existingFailures: 4 }),
  );
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const browser = await launchBrowser(t);
  if (!browser) {
    t.skip('Chrome/Edge or playwright-core not available; mock Flow test skipped.');
    return;
  }

  const page = await browser.newPage();
  t.after(() => page.close().catch(() => {}));
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  const result = await generateImage({
    session: mockSession(page),
    prompt:
      'Extreme macro cinematic shot of a tiny samosa on a miniature brass plate, giant hands nearby, 1:12 scale, shallow depth of field.',
    projectId: 'mock-project-stale-failure',
    projectTitle: 'Mock project',
    stageLabel: 'S2',
  });

  assert.equal(result.mimeType, 'image/png');
  assert.ok(result.buffer.equals(PNG_BYTES), 'the new image should still be captured');
  assert.equal(
    await page.locator('#results section').count(),
    4,
    'the stale failure cards should be left untouched',
  );
});

test('mock Flow: a newly added anti-abuse card fails with the flow_abuse code', async (t) => {
  const { server, base } = await startMockServer(
    'image',
    mockFlowHtml('image', { existingFailures: 2, failOnGenerate: true }),
  );
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const browser = await launchBrowser(t);
  if (!browser) {
    t.skip('Chrome/Edge or playwright-core not available; mock Flow test skipped.');
    return;
  }

  const page = await browser.newPage();
  t.after(() => page.close().catch(() => {}));
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  await assert.rejects(
    generateImage({
      session: mockSession(page),
      prompt:
        'Extreme macro cinematic shot of a tiny samosa on a miniature brass plate, giant hands nearby, 1:12 scale, shallow depth of field.',
      projectId: 'mock-project-new-failure',
      projectTitle: 'Mock project',
      stageLabel: 'S3',
    }),
    (error) => {
      assert.equal(error.code, 'flow_abuse');
      assert.match(error.message, /account and network/);
      assert.equal(error.details.failureCode, 'flow_abuse');
      return true;
    },
  );
});

test('mock Flow: a capped failure grid cannot hide a new anti-abuse block', async (t) => {
  const { server, base } = await startMockServer(
    'image',
    mockFlowHtml('image', {
      existingFailures: 2,
      failOnGenerate: true,
      maxFailures: 2,
    }),
  );
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const browser = await launchBrowser(t);
  if (!browser) {
    t.skip('Chrome/Edge or playwright-core not available; mock Flow test skipped.');
    return;
  }

  const page = await browser.newPage();
  t.after(() => page.close().catch(() => {}));
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  const started = Date.now();
  await assert.rejects(
    generateImage({
      session: mockSession(page),
      prompt:
        'Extreme macro cinematic shot of a tiny samosa on a miniature brass plate, giant hands nearby, 1:12 scale, shallow depth of field.',
      projectId: 'mock-project-capped-failure',
      projectTitle: 'Mock project',
      stageLabel: 'S4',
    }),
    (error) => {
      assert.equal(error.code, 'flow_abuse');
      assert.equal(error.details.failureCode, 'flow_abuse');
      return true;
    },
  );
  assert.ok(
    Date.now() - started < 10_000,
    'the capped failure grid should still fail fast',
  );
});

test('mock Flow 2026: image mode selects 9:16, x1, and the Start generation button', async (t) => {
  const { server, base } = await startMockServer('image', mockFlowV2Html());
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const browser = await launchBrowser(t);
  if (!browser) {
    t.skip('Chrome/Edge or playwright-core not available; mock Flow test skipped.');
    return;
  }

  const page = await browser.newPage();
  t.after(() => page.close().catch(() => {}));
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  const result = await generateImage({
    session: mockSession(page),
    prompt: 'Extreme macro shot of a tiny clay pot of biryani on a wooden table, warm window light.',
    projectId: 'mock-project-2026',
    projectTitle: 'Mock project',
    stageLabel: 'S1',
  });

  assert.equal(result.mimeType, 'image/png');
  assert.ok(result.buffer.equals(PNG_BYTES), 'image bytes should round-trip unchanged');
  assert.equal(result.aspectApplied, true);

  const checked = await page.evaluate(() =>
    [...document.querySelectorAll('button[role="radio"][aria-checked="true"]')].map(
      (radio) => radio.textContent.trim(),
    ),
  );
  assert.ok(checked.some((label) => /9:16/.test(label)), '9:16 should be selected');
  assert.ok(checked.some((label) => /x1/.test(label)), 'one output should be selected');
  assert.ok(checked.some((label) => /Image/.test(label)), 'image mode should stay selected');

  const promptValue = await page.locator('#prompt').innerText();
  assert.match(promptValue, /Extreme macro shot/);
  assert.equal(await page.locator('#settings').isHidden(), true, 'settings card should close before generating');
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
