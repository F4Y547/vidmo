#!/usr/bin/env node
/**
 * VidMo → Google Flow discovery spike (S0)
 *
 * Launches the same visible Chrome window and the same persistent local profile
 * that the VidMo server uses (data/flow-profile), waits for you to sign in to
 * Google Flow yourself, then reads the live DOM and writes:
 *
 *   data/flow/diagnostics/discover-<stamp>.json   full element inventory + ARIA
 *   data/flow/diagnostics/discover-<stamp>.png    screenshot of the signed-in page
 *   data/flow/diagnostics/latest.json             copy of the newest capture
 *   data/flow/selectors.suggested.json            proposed selector overrides
 *
 * Nothing is generated and no credits are spent. Nothing leaves this machine.
 * If a step in the app fails later, run this again and compare the suggested
 * selectors with data/flow/selectors.json.
 *
 * Usage:
 *   npm run flow:discover
 *   npm run flow:discover -- --exit            capture, then close immediately
 *   npm run flow:discover -- --timeout=15      wait up to 15 minutes for sign-in
 *   npm run flow:discover -- --url=https://flow.google.com/
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

process.loadEnvFile?.();

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message) {
  console.error(`\n[vidmo:discover] ${message}\n`);
  process.exitCode = 1;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    fail(
      'Flow discovery needs the optional playwright-core package.\n' +
        'Run: npm install playwright-core\n' +
        'The core studio and the Flow pack export still work without it.',
    );
    return;
  }

  const [
    { FLOW_DIR, FLOW_PROFILE_DIR, relativeDataPath },
    { installedBrowser },
    selectors,
  ] = await Promise.all([
    import('../src/server/paths.js'),
    import('../src/server/flow/session.js'),
    import('../src/server/flow/selectors.js'),
  ]);
  const { inspectFlowPage } = selectors;

  const flowUrl =
    option('url', process.env.VIDMO_FLOW_URL || 'https://flow.google.com/');
  const headless = hasFlag('headless') || process.env.VIDMO_FLOW_HEADLESS === '1';
  const keepOpen = !hasFlag('exit');
  const timeoutMinutes = Math.max(
    1,
    Number(option('timeout', String(Number(process.env.VIDMO_FLOW_LOGIN_TIMEOUT_MS || 600_000) / 60_000))) || 10,
  );
  const diagnosticsDir = path.join(FLOW_DIR, 'diagnostics');

  await fs.mkdir(FLOW_DIR, { recursive: true });
  await fs.mkdir(FLOW_PROFILE_DIR, { recursive: true });
  await fs.mkdir(diagnosticsDir, { recursive: true });
  await fs.mkdir(path.join(FLOW_DIR, 'downloads'), { recursive: true });

  console.log('[vidmo:discover] Google Flow discovery spike (no generation, no credits)');
  console.log(`[vidmo:discover] Profile: ${relativeDataPath(FLOW_PROFILE_DIR)}`);
  console.log(`[vidmo:discover] URL:     ${flowUrl}`);
  console.log('[vidmo:discover] Opening a visible browser window…');

  const baseOptions = {
    headless,
    viewport: null,
    acceptDownloads: true,
    downloadsPath: path.join(FLOW_DIR, 'downloads'),
    locale: 'en-US',
    args: headless ? [] : ['--start-maximized'],
  };

  const browser = await installedBrowser();
  const attempts = [];
  if (browser?.executablePath) {
    attempts.push({
      label: browser.label,
      options: { ...baseOptions, executablePath: browser.executablePath },
    });
  }
  attempts.push({ label: 'Google Chrome', options: { ...baseOptions, channel: 'chrome' } });
  attempts.push({ label: 'Microsoft Edge', options: { ...baseOptions, channel: 'msedge' } });

  let context = null;
  let lastError = null;
  for (const attempt of attempts) {
    try {
      context = await chromium.launchPersistentContext(FLOW_PROFILE_DIR, attempt.options);
      console.log(`[vidmo:discover] Browser: ${attempt.label}`);
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!context) {
    fail(
      `Could not launch Chrome/Edge (${lastError?.message || 'unknown error'}).\n` +
        'Install Google Chrome or Microsoft Edge, or set VIDMO_FLOW_BROWSER to a browser executable.',
    );
    return;
  }

  process.on('SIGINT', () => {
    context?.close().catch(() => {});
    process.exit(130);
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(flowUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});

  const deadline = Date.now() + timeoutMinutes * 60_000;
  let inspection = await inspectFlowPage(page).catch(() => null);
  let announced = '';
  while (!(inspection?.state === 'ready' && inspection.onFlow)) {
    if (Date.now() > deadline) {
      console.log(
        `\n[vidmo:discover] Still not signed in after ${timeoutMinutes} minute(s). ` +
          'Capture skipped. Run the command again when you are ready.',
      );
      await closeContext(context, false);
      process.exitCode = 2;
      return;
    }
    const label =
      inspection?.signInVisible || /accounts\.google\.com/i.test(page.url())
        ? 'Waiting for Google sign-in in the Flow window…'
        : 'Waiting for Flow to finish loading…';
    if (label !== announced) {
      announced = label;
      console.log(`[vidmo:discover] ${label}`);
    }
    await sleep(2000);
    inspection = await inspectFlowPage(page).catch(() => null);
  }

  // Give the app a moment to settle after the redirect chain finishes.
  await sleep(2500);
  console.log('[vidmo:discover] Flow is signed in. Capturing the live DOM…');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotFile = path.join(diagnosticsDir, `discover-${stamp}.png`);
  await page.screenshot({ path: screenshotFile, fullPage: false }).catch(() => {});
  await fs
    .copyFile(screenshotFile, path.join(diagnosticsDir, 'latest.png'))
    .catch(() => {});

  const pageInfo = await page
    .evaluate(() => {
      const escapeValue = (value) =>
        window.CSS && CSS.escape
          ? CSS.escape(value)
          : String(value).replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);

      const cssPath = (element) => {
        if (!(element instanceof Element)) return '';
        const parts = [];
        let node = element;
        while (node && node.nodeType === 1 && parts.length < 6) {
          let part = node.tagName.toLowerCase();
          const testId = node.getAttribute('data-testid');
          if (testId) {
            parts.unshift(`[data-testid="${testId.replace(/"/g, '\\"')}"]`);
            break;
          }
          const id = node.getAttribute('id');
          if (id) {
            parts.unshift(`#${escapeValue(id)}`);
            break;
          }
          const label = node.getAttribute('aria-label') || node.getAttribute('placeholder');
          if (label && label.trim()) {
            part += `[aria-label*="${label.trim().slice(0, 60).replace(/"/g, '\\"')}" i]`;
            parts.unshift(part);
            break;
          }
          const parent = node.parentElement;
          if (parent) {
            const siblings = [...parent.children].filter(
              (sibling) => sibling.tagName === node.tagName,
            );
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
          }
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      };

      const selector =
        'button, a, input, textarea, select, [role="button"], [role="menuitem"], ' +
        '[role="option"], [role="tab"], [contenteditable="true"]';
      const elements = [...document.querySelectorAll(selector)]
        .slice(0, 600)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            role: element.getAttribute('role'),
            type: element.getAttribute('type'),
            name:
              element.getAttribute('aria-label') ||
              element.getAttribute('placeholder') ||
              element.innerText?.trim().replace(/\s+/g, ' ').slice(0, 160) ||
              '',
            testId: element.getAttribute('data-testid'),
            disabled: Boolean(element.disabled),
            visible:
              rect.width > 0 &&
              rect.height > 0 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none',
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            cssPath: cssPath(element),
          };
        });

      const images = [...document.querySelectorAll('img')]
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 40 && rect.height > 40;
        })
        .slice(0, 30)
        .map((img) => ({
          src: String(img.currentSrc || img.src || '').slice(0, 300),
          width: Math.round(img.getBoundingClientRect().width),
          height: Math.round(img.getBoundingClientRect().height),
        }));

      const videos = [...document.querySelectorAll('video')]
        .filter((video) => video.getBoundingClientRect().width > 40)
        .map((video) => ({
          src: String(video.currentSrc || video.src || '').slice(0, 300),
          duration: Number.isFinite(video.duration) ? video.duration : null,
        }));

      return {
        title: document.title,
        url: location.href,
        bodyText: (document.body?.innerText ?? '').slice(0, 15_000),
        elements,
        images,
        videos,
      };
    })
    .catch(() => ({ title: '', url: page.url(), bodyText: '', elements: [], images: [], videos: [] }));

  const aria = await page
    .locator('body')
    .ariaSnapshot({ timeout: 8000 })
    .catch(() => '');

  const visible = pageInfo.elements.filter((element) => element.visible);
  const suggested = suggestSelectors(visible);

  const report = {
    savedAt: new Date().toISOString(),
    tool: 'vidmo flow:discover',
    flowUrl,
    profile: relativeDataPath(FLOW_PROFILE_DIR),
    inspection,
    screenshot: path.basename(screenshotFile),
    elementCount: pageInfo.elements.length,
    visibleElementCount: visible.length,
    suggestedSelectors: suggested,
    images: pageInfo.images,
    videos: pageInfo.videos,
    aria: String(aria).slice(0, 60_000),
    url: pageInfo.url,
    title: pageInfo.title,
    bodyText: pageInfo.bodyText,
  };

  const reportFile = path.join(diagnosticsDir, `discover-${stamp}.json`);
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(
    path.join(diagnosticsDir, 'latest.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );

  const suggestionsFile = path.join(FLOW_DIR, 'selectors.suggested.json');
  await fs.writeFile(suggestionsFile, JSON.stringify(suggested, null, 2), 'utf8');

  console.log('\n[vidmo:discover] Capture complete.');
  console.log(`  Report:      ${relativeDataPath(reportFile)}`);
  console.log(`  Screenshot:  ${relativeDataPath(screenshotFile)}`);
  console.log(`  Suggested:   ${relativeDataPath(suggestionsFile)}`);
  console.log(`  Elements:    ${visible.length} visible of ${pageInfo.elements.length}`);
  console.log(`  Page title:  ${pageInfo.title || '(none)'}`);
  console.log(`  Page URL:    ${pageInfo.url}`);
  const suggestedKeys = Object.keys(suggested);
  console.log(
    `  Selector hits: ${suggestedKeys.length ? suggestedKeys.join(', ') : 'none — the suggested file was not updated'}`,
  );
  console.log(
    '\n[vidmo:discover] Review data/flow/selectors.suggested.json, then copy it to\n' +
      'data/flow/selectors.json to override VidMo\'s defaults. Only add selectors you\n' +
      'recognize; the defaults stay as fallbacks.\n',
  );

  await closeContext(context, keepOpen);
}

function suggestSelectors(elements) {
  const withPath = elements.filter((element) => element.cssPath);
  const match = (pattern, extra = () => true) =>
    withPath
      .filter((element) => pattern.test(element.name || '') && extra(element))
      .map((element) => element.cssPath)
      .filter((value, index, all) => all.indexOf(value) === index)
      .slice(0, 4);

  const suggested = {};

  const promptFields = withPath
    .filter(
      (element) =>
        element.tag === 'textarea' ||
        (element.role === 'textbox' && element.tag !== 'button') ||
        element.tag === 'input',
    )
    .map((element) => element.cssPath)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 4);
  if (promptFields.length) suggested.prompt = promptFields;

  const newProject = match(/new project|create new|start a new|new video/i);
  if (newProject.length) suggested.newProject = newProject;

  const generate = match(/^generate|generate\b|create video|create image/i, (element) =>
    ['button', 'a'].includes(element.tag),
  );
  if (generate.length) suggested.generate = generate;

  const model = match(/nano banana|veo|omni|imagen/i, (element) =>
    ['button', 'a'].includes(element.tag),
  );
  if (model.length) suggested.model = model;

  const videoOption = match(/^video$/i, (element) =>
    ['menuitem', 'option', 'tab'].includes(element.role || ''),
  );
  if (videoOption.length) suggested.videoOption = videoOption;

  const imageOption = match(/^(image|image \d|photo)$/i, (element) =>
    ['menuitem', 'option', 'tab'].includes(element.role || ''),
  );
  if (imageOption.length) suggested.imageOption = imageOption;

  const framesOption = match(/^frames?$/i);
  if (framesOption.length) suggested.framesOption = framesOption;

  const addStartFrame = match(/start frame|first frame|add frame/i);
  if (addStartFrame.length) suggested.addStartFrame = addStartFrame;

  const aspect = match(/9:16|portrait|aspect ratio/i);
  if (aspect.length) suggested.aspect = aspect;

  const download = match(/download/i, (element) => ['button', 'a'].includes(element.tag));
  if (download.length) suggested.download = download;

  return suggested;
}

async function closeContext(context, keepOpen) {
  if (!keepOpen || !process.stdin.isTTY || !context) {
    await context?.close().catch(() => {});
    return;
  }
  console.log('[vidmo:discover] Press Enter to close the Flow window (or just close it).');
  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin });
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      rl.close();
      resolve();
    };
    rl.once('line', finish);
    context.once('close', finish);
  });
  await context.close().catch(() => {});
}

main().catch((error) => {
  fail(error?.stack || String(error));
});
