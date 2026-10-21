import path from 'node:path';
import { promises as fs } from 'node:fs';
import { FlowAutomationError, FlowError } from './errors.js';
import {
  clickFirst,
  detectBlockingText,
  diffFailureCounts,
  failureMarkerCounts,
  findFirst,
  loadSelectors,
  modelLabel,
  visibleText,
} from './selectors.js';

const IMAGE_TIMEOUT_MS = Number(process.env.VIDMO_FLOW_IMAGE_TIMEOUT_MS || 8 * 60 * 1000);
const VIDEO_TIMEOUT_MS = Number(process.env.VIDMO_FLOW_VIDEO_TIMEOUT_MS || 25 * 60 * 1000);
const POLL_MS = Math.max(50, Number(process.env.VIDMO_FLOW_POLL_MS) || 2500);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
    timer.unref?.();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * A small human cadence between UI actions. Flow's anti-abuse check is less
 * likely to fire when the composer is typed and submitted like a person rather
 * than filled and clicked in the same millisecond.
 */
function humanDelay(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function abortError() {
  const error = new Error('Generation cancelled');
  error.name = 'AbortError';
  error.code = 'generation_cancelled';
  return error;
}

function checkAbort(signal) {
  if (signal?.aborted) throw abortError();
}

async function diagnostics(session, label) {
  await session.screenshot({ label }).catch(() => {});
  await session.captureDiagnostics().catch(() => {});
}

async function setPrompt(page, prompt, { signal, session } = {}) {
  const selectors = await loadSelectors();
  const field = await findFirst(page, selectors.prompt, { timeout: 15_000 });
  if (!field) {
    await diagnostics(session, 'prompt-missing');
    throw new FlowAutomationError(
      'The Flow prompt field was not found. Open Flow, capture diagnostics, and check the selector map.',
      { step: 'prompt', url: page.url() },
    );
  }
  checkAbort(signal);
  await field.click({ timeout: 8000 }).catch(() => {});
  await sleep(humanDelay(180, 380));
  await page.keyboard.press('Control+A').catch(() => {});
  await page.keyboard.press('Backspace').catch(() => {});
  await sleep(humanDelay(120, 260));
  const configuredDelay = Number(process.env.VIDMO_FLOW_TYPE_DELAY_MS);
  const perChar =
    Number.isFinite(configuredDelay) && configuredDelay >= 0
      ? configuredDelay
      : humanDelay(14, 26);
  let filled = false;
  try {
    // Type with real key events instead of an instant DOM fill.
    await page.keyboard.type(prompt, { delay: perChar, timeout: 120_000 });
    filled = true;
  } catch {
    filled = false;
  }
  if (!filled) {
    await field.click({ timeout: 8000 }).catch(() => {});
    await page.keyboard.insertText(prompt);
  }
  checkAbort(signal);
  await sleep(humanDelay(350, 700));
  const actual = await field
    .evaluate((element) => {
      if ('value' in element && typeof element.value === 'string') return element.value;
      return element.innerText ?? element.textContent ?? '';
    })
    .catch(() => '');
  const normalized = String(actual ?? '').trim();
  if (normalized.length < Math.min(40, prompt.length * 0.5)) {
    await diagnostics(session, 'prompt-rejected');
    throw new FlowAutomationError(
      'The Flow prompt field did not accept the full prompt. This usually means Flow changed its editor. Capture diagnostics and retry.',
      { step: 'prompt', expected: prompt.length, actual: normalized.length, url: page.url() },
    );
  }
  return normalized.length;
}

async function chooseMenuOption(page, selectors, label, { required = false } = {}) {
  const option = await findFirst(page, selectors, { timeout: 2500 });
  if (!option) {
    if (required) {
      throw new FlowAutomationError(
        `Could not find the ${label} option in Flow. Capture diagnostics so the selector map can be updated.`,
        { step: label },
      );
    }
    return false;
  }
  await option.click({ timeout: 6000 });
  await sleep(500);
  return true;
}

async function chooseNamedModel(page, name, signal) {
  const selectors = await loadSelectors();
  const modelButton = await findFirst(page, selectors.model, { timeout: 2000 });
  if (!modelButton) return false;
  await modelButton.click({ timeout: 5000 }).catch(() => {});
  await sleep(350);
  const option = page.getByText(name, { exact: false }).last();
  if (await option.isVisible({ timeout: 2500 }).catch(() => false)) {
    checkAbort(signal);
    await option.click({ timeout: 5000 });
    await sleep(500);
    return true;
  }
  await page.keyboard.press('Escape').catch(() => {});
  return false;
}

/**
 * The 2026 Flow composer exposes its controls through a "Settings trigger"
 * button that toggles a card with radio options (Image/Video, aspect ratio,
 * model family, resolution, duration, output count). These helpers drive that
 * card and stay inert on Flow builds without it.
 */
async function hasNewFlowComposer(page) {
  const selectors = await loadSelectors();
  const trigger = (selectors.settingsTrigger ?? []).join(', ');
  if (!trigger) return false;
  return page
    .locator(trigger)
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);
}

async function settingsCardOpen(page) {
  return page
    .locator('button[role="radio"]')
    .first()
    .isVisible({ timeout: 250 })
    .catch(() => false);
}

async function openFlowSettings(page) {
  if (await settingsCardOpen(page)) return true;
  const selectors = await loadSelectors();
  const trigger = await findFirst(page, selectors.settingsTrigger ?? [], { timeout: 1500 });
  if (!trigger) return false;
  await trigger.click({ timeout: 5000 }).catch(() => {});
  const deadline = Date.now() + 2500;
  while (Date.now() < deadline) {
    if (await settingsCardOpen(page)) return true;
    await sleep(120);
  }
  return false;
}

async function closeFlowSettings(page) {
  if (!(await settingsCardOpen(page))) return;
  const selectors = await loadSelectors();
  const trigger = await findFirst(page, selectors.settingsTrigger ?? [], { timeout: 1200 });
  if (trigger) await trigger.click({ timeout: 5000 }).catch(() => {});
  await sleep(200);
}

/**
 * Click the first visible radio; skip the click when it is already checked so
 * Flow does not toggle a selection off. Returns true when the option exists.
 */
async function setRadio(page, selectorList, { timeout = 1200 } = {}) {
  for (const selector of selectorList ?? []) {
    const locator = page.locator(selector).first();
    if (!(await locator.isVisible({ timeout }).catch(() => false))) continue;
    const checked = await locator.getAttribute('aria-checked').catch(() => null);
    if (checked !== 'true') {
      await locator.click({ timeout: 5000 }).catch(() => {});
      await sleep(250);
    }
    return true;
  }
  return false;
}

async function selectMode(page, mode, { signal, onProgress } = {}) {
  const selectors = await loadSelectors();

  // The 2026 Flow composer keeps Image/Video, aspect, model, resolution and
  // output count inside a "Settings trigger" panel. Handle it first; the text
  // and menu selectors below remain as fallbacks for other Flow builds.
  if (await hasNewFlowComposer(page)) {
    onProgress?.(mode === 'video' ? 'Switching Flow to video mode…' : 'Switching Flow to image mode…');
    const opened = await openFlowSettings(page);
    if (opened) {
      const modeSelected = await setRadio(
        page,
        mode === 'video' ? selectors.videoMode : selectors.imageMode,
      );
      if (mode === 'video') {
        await sleep(500);
        await setRadio(page, selectors.framesMode, { timeout: 1500 });
        await setRadio(page, selectors.resolution, { timeout: 1200 });
        await setRadio(page, selectors.videoDuration, { timeout: 1200 });
      }
      await sleep(300);
      const label = await modelLabel(page);
      if (!modeSelected) {
        if (mode === 'video') {
          throw new FlowAutomationError(
            'Flow’s new composer did not switch to video mode. Capture diagnostics and check the selector map.',
            { step: 'video-mode', modelLabel: label },
          );
        }
        return { mode: 'image', label, warning: 'Could not switch Flow back to image mode.' };
      }
      return { mode, label, warning: null };
    }
    if (mode === 'video') {
      throw new FlowAutomationError(
        'Flow’s settings panel did not open, so video mode could not be selected.',
        { step: 'settings' },
      );
    }
  }

  const current = await modelLabel(page);
  const currentLooksVideo = /video|veo|omni|frames/i.test(current);
  const currentLooksImage = /image|nano banana|imagen/i.test(current);

  if (mode === 'image' && (currentLooksImage || !current)) {
    return { mode: 'image', label: current, warning: null };
  }
  if (mode === 'video' && currentLooksVideo) {
    // Some Flow builds expose Frames as a separate mode after Video.
    const frames = await findFirst(page, selectors.framesOption, { timeout: 700 });
    if (frames) await frames.click({ timeout: 5000 }).catch(() => {});
    return { mode: 'video', label: current, warning: null };
  }

  onProgress?.(mode === 'video' ? 'Switching Flow to video mode…' : 'Switching Flow to image mode…');
  const modelButton = await findFirst(page, selectors.model, { timeout: 4000 });
  if (!modelButton) {
    if (mode === 'image') {
      return {
        mode: 'image',
        label: current,
        warning: 'Could not find a Flow model selector. Using Flow’s default image mode.',
      };
    }
    throw new FlowAutomationError(
      'Could not find the Flow model selector to switch to video. Capture diagnostics and check the selector map.',
      { step: 'model' },
    );
  }
  await modelButton.click({ timeout: 8000 });
  await sleep(500);
  const options = mode === 'video' ? selectors.videoOption : selectors.imageOption;
  const selected = await chooseMenuOption(page, options, mode, { required: mode === 'video' });
  if (!selected && mode === 'image') {
    await page.keyboard.press('Escape').catch(() => {});
    return { mode: 'image', label: current, warning: 'Could not switch Flow back to image mode.' };
  }

  if (mode === 'video') {
    const configuredModel = process.env.VIDMO_FLOW_VIDEO_MODEL;
    if (configuredModel) {
      const named = await chooseNamedModel(page, configuredModel, signal);
      if (!named) {
        onProgress?.(`Video model "${configuredModel}" was not found; using Flow’s default.`);
      }
    }
    const frames = await findFirst(page, selectors.framesOption, { timeout: 1200 });
    if (frames) await frames.click({ timeout: 5000 }).catch(() => {});
  } else if (process.env.VIDMO_FLOW_IMAGE_MODEL) {
    await chooseNamedModel(page, process.env.VIDMO_FLOW_IMAGE_MODEL, signal);
  }

  await sleep(500);
  const label = await modelLabel(page);
  if (mode === 'video' && !/video|veo|omni|frames/i.test(label)) {
    const addStart = await findFirst(page, selectors.addStartFrame, { timeout: 2000 });
    if (!addStart) {
      throw new FlowAutomationError(
        'Flow did not switch to video mode. Capture diagnostics so the video-mode selectors can be updated.',
        { step: 'video-mode', modelLabel: label },
      );
    }
  }
  return { mode, label: label || current, warning: null };
}

async function setAspectRatio(page, { signal } = {}) {
  const selectors = await loadSelectors();
  checkAbort(signal);

  // New Flow composer: pick 9:16 and one output from the settings card.
  if (await hasNewFlowComposer(page)) {
    const opened = await openFlowSettings(page);
    if (opened) {
      const applied = await setRadio(page, selectors.aspect);
      await setRadio(page, selectors.outputCount, { timeout: 800 });
      await closeFlowSettings(page);
      return applied
        ? { applied: true, warning: null }
        : {
            applied: false,
            warning:
              'Flow’s 9:16 aspect control was not found. The prompts still specify vertical 9:16, but check the output ratio.',
          };
    }
  }

  const visibleAspect = await findFirst(
    page,
    ['button:has-text("9:16")', '[role="button"]:has-text("9:16")'],
    { timeout: 700 },
  );
  if (visibleAspect) {
    const text = (await visibleAspect.innerText().catch(() => '')).trim();
    if (/9\s*:\s*16/i.test(text)) return { applied: true, warning: null };
  }
  const control = await findFirst(
    page,
    [
      'button:has-text("16:9")',
      'button[aria-label*="aspect" i]',
      '[role="button"][aria-label*="aspect" i]',
      ...selectors.aspect,
    ],
    { timeout: 900 },
  );
  if (!control) {
    return {
      applied: false,
      warning:
        'Flow’s 9:16 aspect control was not found. The prompts still specify vertical 9:16, but check the output ratio.',
    };
  }
  await control.click({ timeout: 5000 }).catch(() => {});
  await sleep(400);
  const option = await findFirst(
    page,
    [
      '[role="menuitem"]:has-text("9:16")',
      '[role="option"]:has-text("9:16")',
      'button:has-text("9:16")',
      'text=/9\\s*:\\s*16/',
    ],
    { timeout: 2000 },
  );
  if (option) {
    await option.click({ timeout: 5000 }).catch(() => {});
    await sleep(300);
    return { applied: true, warning: null };
  }
  await page.keyboard.press('Escape').catch(() => {});
  return {
    applied: false,
    warning:
      'The 9:16 option did not appear after opening Flow’s aspect menu. Confirm the output is vertical.',
  };
}

async function attachStartFrame(page, imagePath, { signal, session } = {}) {
  const selectors = await loadSelectors();
  checkAbort(signal);
  let fileInput = await findFirst(page, ['input[type="file"]'], { timeout: 700, visible: false });
  const addStart = await findFirst(page, selectors.addStartFrame, { timeout: 2500 });

  if (addStart) {
    const chooserPromise = page
      .waitForEvent('filechooser', { timeout: 6000 })
      .catch(() => null);
    await addStart.click({ timeout: 6000 }).catch(() => {});
    let chooser = await chooserPromise;
    if (!chooser) {
      // The 2026 "Frames" start tile opens a small menu instead of the file
      // picker directly. Choose the upload entry, then wait for its chooser.
      const uploadOption = await findFirst(
        page,
        [
          '[role="menuitem"]:has-text("Upload")',
          'button:has-text("Upload from computer")',
          'button:has-text("Upload media")',
          'button:has-text("Upload")',
          'text=/Upload from computer/i',
          'text=/Choose file/i',
        ],
        { timeout: 2000 },
      );
      if (uploadOption) {
        const chooserAgain = page
          .waitForEvent('filechooser', { timeout: 6000 })
          .catch(() => null);
        await uploadOption.click({ timeout: 5000 }).catch(() => {});
        chooser = await chooserAgain;
      }
    }
    if (chooser) {
      await chooser.setFiles(imagePath);
    } else if (!fileInput) {
      fileInput = await findFirst(page, ['input[type="file"]'], { timeout: 2500, visible: false });
      if (fileInput) await fileInput.setInputFiles(imagePath);
    }
  }

  if (!fileInput) {
    fileInput = await findFirst(
      page,
      ['input[type="file"][accept*="image"]', 'input[type="file"]'],
      { timeout: 2500, visible: false },
    );
  }
  if (!fileInput) {
    throw new FlowAutomationError(
      'Could not find Flow’s start-frame upload control. Capture diagnostics so the video selector map can be updated.',
      { step: 'start-frame' },
    );
  }
  if (addStart && fileInput) {
    // The chooser may already have consumed the file; setting it again is harmless
    // for Flow's hidden input and makes this path work across Flow builds.
    await fileInput.setInputFiles(imagePath).catch(() => {});
  } else {
    await fileInput.setInputFiles(imagePath);
  }

  // Wait for the upload to settle. Flow shows a thumbnail or an "Uploading" label.
  const started = Date.now();
  while (Date.now() - started < 45_000) {
    checkAbort(signal);
    const text = await visibleText(page, 3000);
    const blocked = detectBlockingText(text);
    if (blocked && ['captcha', 'credits', 'terms', 'signin'].includes(blocked.kind)) {
      await session.waitForManual(blocked.message, { signal });
      continue;
    }
    if (!/uploading|processing image|preparing/i.test(text)) break;
    await sleep(1200);
  }
  return path.basename(imagePath);
}

async function clickGenerate(page, { signal, session } = {}) {
  const selectors = await loadSelectors();
  checkAbort(signal);
  const button = await findFirst(page, selectors.generate, { timeout: 8000 });
  if (!button) {
    await diagnostics(session, 'generate-missing');
    throw new FlowAutomationError(
      'Could not find Flow’s Generate button. Capture diagnostics so the selector map can be updated.',
      { step: 'generate', url: page.url() },
    );
  }
  const disabled = await button.isDisabled().catch(() => false);
  if (disabled) {
    await diagnostics(session, 'generate-disabled');
    throw new FlowAutomationError(
      'Flow’s Generate button is disabled. Make sure a prompt is present and the account has credits.',
      { step: 'generate', url: page.url() },
    );
  }
  await sleep(humanDelay(450, 900));
  checkAbort(signal);
  // Snapshot existing failure cards as late as possible so a card left over
  // from an earlier attempt cannot be mistaken for this generation's result.
  const failureBaseline = await failureMarkerCounts(page);
  await button.click({ timeout: 10_000 });
  return failureBaseline;
}

async function mediaCandidates(page, kind) {
  try {
    return await withTimeout(
      page.evaluate((requestedKind) => {
        const selector = requestedKind === 'clip' ? 'video' : 'img';
        return [...document.querySelectorAll(selector)]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const src = element.currentSrc || element.src || element.querySelector('source')?.src || '';
            const area = Math.max(0, rect.width) * Math.max(0, rect.height);
            const visible =
              rect.width > 40 &&
              rect.height > 40 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              Number(style.opacity || 1) > 0.05;
            return {
              src,
              key: `${src}|${Math.round(rect.width)}x${Math.round(rect.height)}|${element.getAttribute('poster') ?? ''}`,
              area: Math.round(area),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              naturalWidth: element.naturalWidth || element.videoWidth || 0,
              naturalHeight: element.naturalHeight || element.videoHeight || 0,
              duration: Number.isFinite(element.duration) ? element.duration : null,
              readyState: element.readyState ?? null,
              visible,
              alt: element.getAttribute('alt') ?? '',
              poster: element.getAttribute('poster') ?? '',
            };
          })
          .filter((item) => item.visible && item.src && item.area > 20_000)
          .sort((a, b) => b.area - a.area)
          .slice(0, 20);
      }, kind),
      5000,
      'Flow media scan timed out',
    );
  } catch {
    return [];
  }
}

async function mediaSignature(page, kind) {
  const candidates = await mediaCandidates(page, kind);
  return new Set(candidates.map((item) => item.key));
}

async function isLoading(page) {
  const selectors = await loadSelectors();
  const busy = await findFirst(page, selectors.busy, { timeout: 500 });
  if (!busy) return false;
  const text = (await busy.innerText().catch(() => '')).trim();
  // "Generate" is not a loading label; only trust status language.
  return /generating|creating|rendering|processing|queued/i.test(text) || /true/i.test(await busy.getAttribute('aria-busy').catch(() => ''));
}

async function raiseFlowFailure({ session, kind, failureText, pageText }) {
  const classified = detectBlockingText(failureText);
  const message =
    classified?.kind === 'failure'
      ? classified.message
      : 'Flow reported this generation as failed. Check the Flow window, then retry this stage.';
  const code = classified?.code ?? 'flow_generation_failed';
  await diagnostics(session, `${kind}-failure`);
  throw new FlowAutomationError(
    message,
    {
      step: 'generation',
      kind,
      failureCode: code,
      flowText: String(pageText ?? '').slice(0, 1200),
    },
    { code },
  );
}

async function waitForResult(
  page,
  kind,
  before,
  { signal, session, onProgress, failureBaseline = {} } = {},
) {
  const selectors = await loadSelectors();
  const timeout = kind === 'clip' ? VIDEO_TIMEOUT_MS : IMAGE_TIMEOUT_MS;
  const started = Date.now();
  let stableKey = null;
  let stableSince = 0;
  let failureHits = 0;
  let sawResult = false;
  // Flow keeps a bounded grid of failed cards. If the page was already full of
  // them, a new anti-abuse card can replace an old one and the multiset diff
  // above sees no change. The notice is still unambiguous, so stop after a
  // short grace window instead of waiting out the full media timeout.
  const abuseGraceMs = Math.max(
    0,
    Number(process.env.VIDMO_FLOW_ABUSE_GRACE_MS) ||
      (kind === 'clip' ? 120_000 : 60_000),
  );
  let abuseSince = 0;

  while (Date.now() - started < timeout) {
    checkAbort(signal);
    const elapsed = Math.round((Date.now() - started) / 1000);

    // A fresh media element is stronger evidence than page text: Flow keeps
    // failed cards from earlier attempts on the same project page. Check media
    // first so a new image/clip is not discarded because of stale failure copy.
    const candidates = await mediaCandidates(page, kind);
    const fresh = candidates.find((item) => !before.has(item.key));
    if (fresh) {
      failureHits = 0;
      sawResult = true;
      if (fresh.key !== stableKey) {
        stableKey = fresh.key;
        stableSince = Date.now();
      }
      const busy = await isLoading(page);
      const settledFor = Date.now() - stableSince;
      const structurallyReady =
        kind === 'clip'
          ? fresh.readyState === null || fresh.readyState >= 1 || Boolean(fresh.poster)
          : fresh.naturalWidth > 0 || fresh.width > 160;
      if (!busy || settledFor > 8000) {
        if (structurallyReady || settledFor > 4000) {
          onProgress?.(`Flow ${kind === 'clip' ? 'video' : 'image'} ready — saving locally…`);
          await sleep(kind === 'clip' ? 1800 : 900);
          checkAbort(signal);
          const after = await mediaCandidates(page, kind);
          return after.find((item) => item.key === fresh.key) ?? fresh;
        }
      }
    }

    // Captchas, credits, sign-in and terms must still pause the job. Failure
    // text is handled separately below because old failed cards stay in the DOM.
    const text = await visibleText(page, 5000);
    const blocked = detectBlockingText(text);
    if (blocked && blocked.kind !== 'failure') {
      failureHits = 0;
      await session.waitForManual(blocked.message, { signal, onWait: onProgress });
      continue;
    }

    if (blocked?.code === 'flow_abuse') {
      if (!abuseSince) {
        abuseSince = Date.now();
        onProgress?.('Flow is showing an anti-abuse notice; confirming the block…');
      }
      if (Date.now() - abuseSince >= abuseGraceMs) {
        await raiseFlowFailure({ session, kind, failureText: text, pageText: text });
      }
    } else {
      abuseSince = 0;
    }

    const newFailures = diffFailureCounts(
      await failureMarkerCounts(page),
      failureBaseline,
    );
    if (newFailures.length > 0) {
      failureHits += 1;
      if (failureHits === 1) {
        onProgress?.('Flow reported a problem; confirming it belongs to this generation…');
      }
      if (failureHits >= 3) {
        await raiseFlowFailure({
          session,
          kind,
          failureText: newFailures[0],
          pageText: text,
        });
      }
    } else {
      failureHits = 0;
    }

    onProgress?.(
      `Flow is generating stage ${kind === 'clip' ? 'video' : 'image'}… ${elapsed}s`,
    );
    await sleep(POLL_MS);
  }

  // Flow can take the entire timeout before rendering its failure cards, for
  // example while the request is queued. Check once more so a late anti-abuse
  // block is classified as a block instead of an ambiguous timeout.
  const lateFailures = diffFailureCounts(
    await failureMarkerCounts(page),
    failureBaseline,
  );
  if (lateFailures.length > 0) {
    await raiseFlowFailure({
      session,
      kind,
      failureText: lateFailures[0],
      pageText: await visibleText(page, 5000),
    });
  }

  await diagnostics(session, `${kind}-timeout`);
  throw new FlowAutomationError(
    sawResult
      ? `Flow produced a ${kind} preview but it never settled into a downloadable asset.`
      : `Timed out after ${Math.round(timeout / 1000)}s waiting for Flow to finish the ${kind}.`,
    { step: 'generation-timeout', kind, timeoutMs: timeout },
  );
}

function base64ToBuffer(base64) {
  return Buffer.from(String(base64).replace(/^data:[^,]*,/, ''), 'base64');
}

async function fetchMediaSource(page, src) {
  if (!src) return null;
  if (src.startsWith('data:')) {
    const match = src.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!match) return null;
    if (match[2]) {
      return { buffer: base64ToBuffer(match[3]), mimeType: match[1] || 'application/octet-stream' };
    }
    return {
      buffer: Buffer.from(decodeURIComponent(match[3]), 'utf8'),
      mimeType: match[1] || 'application/octet-stream',
    };
  }

  if (!src.startsWith('blob:')) {
    try {
      const response = await page.context().request.get(src, { timeout: 60_000 });
      if (response.ok()) {
        return {
          buffer: Buffer.from(await response.body()),
          mimeType: response.headers()['content-type'] || '',
        };
      }
    } catch {
      /* fall through to in-page fetch */
    }
  }

  const payload = await page.evaluate(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Media fetch failed: ${response.status}`);
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error('Could not read media blob'));
      reader.readAsDataURL(blob);
    });
    return { dataUrl, mimeType: blob.type || '' };
  }, src);
  return {
    buffer: base64ToBuffer(payload.dataUrl),
    mimeType: payload.mimeType,
  };
}

async function downloadFallback(page, kind, session) {
  const selectors = await loadSelectors();
  const buttons = page.locator(selectors.download.join(', '));
  const count = await buttons.count().catch(() => 0);
  if (!count) return null;
  for (let index = count - 1; index >= Math.max(0, count - 4); index -= 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible().catch(() => false))) continue;
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
    await button.click({ timeout: 6000 }).catch(() => {});
    const download = await downloadPromise;
    if (!download) continue;
    const filePath = await download.path();
    if (!filePath) continue;
    const buffer = await fs.readFile(filePath);
    if (!buffer.length) continue;
    return {
      buffer,
      mimeType: kind === 'clip' ? 'video/mp4' : 'image/png',
      source: 'download-button',
    };
  }
  await diagnostics(session, `download-${kind}`);
  return null;
}

async function captureCandidate(page, candidate, kind, { session } = {}) {
  let media = null;
  try {
    media = await fetchMediaSource(page, candidate.src);
  } catch {
    media = null;
  }
  if (media?.buffer?.length) {
    return { ...media, source: candidate.src.startsWith('blob:') ? 'blob' : 'media-src' };
  }
  const downloaded = await downloadFallback(page, kind, session);
  if (downloaded) return downloaded;
  throw new FlowAutomationError(
    `Flow showed a new ${kind}, but VidMo could not read its bytes. Use the download button in Flow, then import the file into this stage.`,
    { step: 'capture', kind },
  );
}

/**
 * Generate one image in Flow. The returned buffer is saved by the caller.
 */
export async function generateImage({
  session,
  prompt,
  projectId,
  projectTitle = '',
  stageLabel = '',
  signal,
  onProgress,
}) {
  await session.ensureReady({ signal, onWait: onProgress });
  return session.runExclusive(async () => {
    const page = session.page;
    await session.startProject(projectId, projectTitle, onProgress);
    const mode = await selectMode(page, 'image', { signal, onProgress });
    const aspect = await setAspectRatio(page, { signal });
    if (aspect.warning) onProgress?.(aspect.warning);
    onProgress?.(`Writing the image prompt for ${stageLabel || 'this stage'}…`);
    const length = await setPrompt(page, prompt, { signal, session });
    const before = await mediaSignature(page, 'image');
    onProgress?.('Sending the image to Google Flow…');
    const failureBaseline = await clickGenerate(page, { signal, session });
    const candidate = await waitForResult(page, 'image', before, {
      signal,
      session,
      onProgress,
      failureBaseline,
    });
    const media = await captureCandidate(page, candidate, 'image', { session });
    return {
      ...media,
      promptLength: length,
      mode: mode.mode,
      modelLabel: mode.label,
      aspectApplied: aspect.applied,
      warnings: [mode.warning, aspect.warning].filter(Boolean),
      flowPageUrl: page.url(),
    };
  });
}

/**
 * Generate one image-to-video clip. The image is supplied as Flow's start frame.
 */
export async function generateVideo({
  session,
  prompt,
  startImagePath,
  projectId,
  projectTitle = '',
  stageLabel = '',
  signal,
  onProgress,
}) {
  await session.ensureReady({ signal, onWait: onProgress });
  return session.runExclusive(async () => {
    const page = session.page;
    await session.startProject(projectId, projectTitle, onProgress);
    const mode = await selectMode(page, 'video', { signal, onProgress });
    const aspect = await setAspectRatio(page, { signal });
    if (aspect.warning) onProgress?.(aspect.warning);
    onProgress?.(`Uploading the approved stage image for ${stageLabel || 'this stage'}…`);
    await attachStartFrame(page, startImagePath, { signal, session });
    onProgress?.('Writing the motion prompt…');
    const length = await setPrompt(page, prompt, { signal, session });
    const before = await mediaSignature(page, 'clip');
    onProgress?.('Sending the shot to Flow video generation…');
    const failureBaseline = await clickGenerate(page, { signal, session });
    const candidate = await waitForResult(page, 'clip', before, {
      signal,
      session,
      onProgress,
      failureBaseline,
    });
    const media = await captureCandidate(page, candidate, 'clip', { session });
    return {
      ...media,
      promptLength: length,
      mode: mode.mode,
      modelLabel: mode.label,
      aspectApplied: aspect.applied,
      warnings: [mode.warning, aspect.warning].filter(Boolean),
      flowPageUrl: page.url(),
    };
  });
}
