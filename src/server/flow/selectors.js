import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FLOW_DIR } from '../paths.js';

/**
 * Flow's DOM is not a public API. These selectors are intentionally layered:
 * accessible labels and visible text first, then structural fallbacks. When a
 * Flow release changes the UI, diagnostics capture the current page so the
 * selector map can be updated without guessing.
 */
export const DEFAULT_SELECTORS = {
  prompt: [
    'textarea',
    '[contenteditable="true"][role="textbox"]',
    '[role="textbox"][contenteditable="true"]',
    'div[role="textbox"]',
    '[contenteditable="true"]',
    'textarea[placeholder*="prompt" i]',
  ],
  newProject: [
    'button:has-text("New project")',
    '[role="button"]:has-text("New project")',
    'button:has-text("Create new")',
    'a:has-text("New project")',
    'button[aria-label*="new project" i]',
  ],
  generate: [
    'button:has-text("Generate")',
    'button[aria-label*="Generate" i]',
    '[role="button"]:has-text("Generate")',
    'button:has-text("Create")',
    'button[type="submit"]:has-text("Generate")',
  ],
  model: [
    'button:has-text("Nano Banana")',
    'button:has-text("Veo")',
    'button:has-text("Omni")',
    'button:has-text("Imagen")',
    'button:has-text("Video")',
    'button:has-text("Image")',
    'button[aria-label*="model" i]',
  ],
  videoOption: [
    '[role="menuitem"]:has-text("Video")',
    '[role="option"]:has-text("Video")',
    'button:has-text("Video")',
    '[data-testid*="video" i]',
    'text=/^Video$/i',
  ],
  imageOption: [
    '[role="menuitem"]:has-text("Image")',
    '[role="option"]:has-text("Image")',
    '[role="menuitem"]:has-text("Nano Banana")',
    'button:has-text("Image")',
    'text=/^Image$/i',
  ],
  framesOption: [
    '[role="menuitem"]:has-text("Frames")',
    '[role="option"]:has-text("Frames")',
    'button:has-text("Frames")',
    'text=/^Frames$/i',
  ],
  addStartFrame: [
    'text=/Add start frame/i',
    'button:has-text("start frame")',
    '[role="button"]:has-text("start frame")',
    '[aria-label*="start frame" i]',
    'text=/Start frame/i',
  ],
  addReference: [
    'text=/Add ingredient/i',
    'text=/Add reference/i',
    'button:has-text("Ingredients")',
    '[aria-label*="reference" i]',
  ],
  aspect: [
    'button:has-text("9:16")',
    '[role="menuitem"]:has-text("9:16")',
    '[role="option"]:has-text("9:16")',
    'button:has-text("Portrait")',
    '[aria-label*="aspect ratio" i]',
    '[aria-label*="9:16" i]',
  ],
  resultImage: [
    'img[src^="blob:"]',
    'img[src^="data:image"]',
    'img[src*="googleusercontent"]',
    'img[src*="storage.googleapis"]',
    'img[src^="https://"]',
  ],
  resultVideo: ['video'],
  download: [
    'button[aria-label*="Download" i]',
    'button:has-text("Download")',
    'a[download]',
    '[role="button"]:has-text("Download")',
  ],
  busy: ['[aria-busy="true"]', 'text=/Generating|Creating|Rendering/i'],
  errorDialog: ['[role="dialog"]', '[role="alert"]'],
};

export const BLOCKING_PATTERNS = [
  {
    kind: 'captcha',
    pattern:
      /verify (?:that )?you(?:'| a)?re human|unusual traffic|complete the captcha|recaptcha|checking your browser/i,
    message:
      'Google Flow needs a human check. Solve it in the Flow window, then click Resume in VidMo.',
  },
  {
    kind: 'credits',
    pattern: /not enough credits|insufficient credits|out of credits|buy more credits|credit limit/i,
    message:
      'Flow reports that this account has no generation credits. Add credits in Flow, then resume.',
  },
  {
    kind: 'signin',
    pattern: /sign in to continue|session expired|choose an account/i,
    message: 'The Google session has expired. Sign in again in the Flow window, then resume.',
  },
  {
    kind: 'terms',
    pattern: /accept the terms|agree to the terms|review and accept/i,
    message: 'Flow is asking you to accept new terms. Accept them in the Flow window, then resume.',
  },
  {
    kind: 'failure',
    pattern:
      /something went wrong|generation failed|failed to generate|try again later|request failed|content policy/i,
    message: 'Flow reported a generation error. Check the Flow window, then resume or reroll.',
  },
];

let cachedSelectors = null;

function mergeSelectors(base, override) {
  const merged = { ...base };
  if (!override || typeof override !== 'object') return merged;
  for (const [key, value] of Object.entries(override)) {
    if (!Array.isArray(value)) continue;
    const clean = value.filter((item) => typeof item === 'string' && item.trim());
    if (clean.length) merged[key] = clean;
  }
  return merged;
}

/**
 * Optional user-maintained selector map at data/flow/selectors.json. This is
 * deliberately a plain JSON file rather than a hidden remote config: the user
 * can inspect and audit every selector VidMo clicks.
 */
export async function loadSelectors({ refresh = false } = {}) {
  if (cachedSelectors && !refresh) return cachedSelectors;
  let override = null;
  try {
    const raw = await fs.readFile(path.join(FLOW_DIR, 'selectors.json'), 'utf8');
    override = JSON.parse(raw);
  } catch {
    override = null;
  }
  cachedSelectors = mergeSelectors(DEFAULT_SELECTORS, override);
  return cachedSelectors;
}

export function detectBlockingText(text) {
  const body = String(text ?? '');
  for (const item of BLOCKING_PATTERNS) {
    if (item.pattern.test(body)) return { kind: item.kind, message: item.message };
  }
  return null;
}

export async function findFirst(page, selectors, { timeout = 1200, visible = true } = {}) {
  for (const selector of selectors ?? []) {
    const locator = page.locator(selector).first();
    try {
      if (visible) {
        if (await locator.isVisible({ timeout })) return locator;
      } else {
        await locator.waitFor({ state: 'attached', timeout });
        return locator;
      }
    } catch {
      /* try the next selector */
    }
  }
  return null;
}

export async function clickFirst(page, selectors, label, options = {}) {
  const locator = await findFirst(page, selectors, options);
  if (!locator) {
    const { FlowAutomationError } = await import('./errors.js');
    throw new FlowAutomationError(
      `Could not find ${label} in the Flow window. Capture diagnostics from the Flow panel so the selector can be updated.`,
      { step: label },
    );
  }
  await locator.click({ timeout: options.clickTimeout ?? 8000 });
  return locator;
}

export async function visibleText(page, limit = 7000) {
  try {
    const text = await page.locator('body').innerText({ timeout: 3000 });
    return String(text ?? '').slice(0, limit);
  } catch {
    return '';
  }
}

export async function inspectFlowPage(page) {
  const url = page.url();
  const text = await visibleText(page);
  const selectors = await loadSelectors();
  const prompt = await findFirst(page, selectors.prompt, { timeout: 500 });
  const newProject = await findFirst(page, selectors.newProject, { timeout: 400 });
  const signInVisible =
    /accounts\.google\.com/i.test(url) ||
    /sign in|use your google account|choose an account/i.test(text);
  const blocked = detectBlockingText(text);
  const onFlow = /labs\.google\/fx\/tools\/flow/i.test(url);
  const title = await page.title().catch(() => '');

  let state = 'unknown';
  if (prompt || newProject) state = 'ready';
  else if (signInVisible || /accounts\.google\.com/i.test(url)) state = 'awaiting_login';
  else if (onFlow) state = 'ready';

  return {
    state,
    url,
    title,
    text,
    onFlow,
    signInVisible,
    hasPrompt: Boolean(prompt),
    hasNewProject: Boolean(newProject),
    blocked,
  };
}

export async function modelLabel(page) {
  const selectors = await loadSelectors();
  const locator = await findFirst(page, selectors.model, { timeout: 800 });
  if (!locator) return '';
  return (await locator.innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 160);
}
