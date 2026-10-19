import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { FLOW_DIR, FLOW_PROFILE_DIR, relativeDataPath } from '../paths.js';
import {
  FlowAutomationError,
  FlowBusyError,
  FlowError,
  flowUnavailable,
} from './errors.js';
import { findFirst, inspectFlowPage, loadSelectors, visibleText } from './selectors.js';

const FLOW_URL = process.env.VIDMO_FLOW_URL || 'https://labs.google/fx/tools/flow';
const LOGIN_TIMEOUT_MS = Number(process.env.VIDMO_FLOW_LOGIN_TIMEOUT_MS || 10 * 60 * 1000);
const ATTENTION_TIMEOUT_MS = Number(process.env.VIDMO_FLOW_ATTENTION_TIMEOUT_MS || 30 * 60 * 1000);
const DIAGNOSTICS_DIR = path.join(FLOW_DIR, 'diagnostics');

/**
 * Google rejects sign-in in a browser that advertises automation, so VidMo
 * launches Chrome the way a person would (no automation flags) and attaches to
 * it over the DevTools protocol. The sign-in then happens in a genuine Google
 * browser session that VidMo never sees the credentials for. Set
 * VIDMO_FLOW_CDP=0 to force the Playwright-managed window instead.
 */
const CDP_ATTACH_ENABLED = process.env.VIDMO_FLOW_CDP !== '0';
const CDP_PORT = Number(process.env.VIDMO_FLOW_CDP_PORT || 9333);
const SIGN_IN_URL =
  process.env.VIDMO_FLOW_SIGNIN_URL ||
  'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fflow.google.com%2F';

let playwrightModule = null;
let playwrightError = null;

async function loadPlaywright() {
  if (playwrightModule) return playwrightModule;
  if (playwrightError) throw playwrightError;
  try {
    playwrightModule = await import('playwright-core');
    return playwrightModule;
  } catch (error) {
    playwrightError = flowUnavailable(
      'Flow automation needs the optional playwright-core package. Run "npm install playwright-core", then reconnect. The Flow pack export still works without it.',
    );
    playwrightError.cause = error;
    throw playwrightError;
  }
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function installedBrowser() {
  const configured = process.env.VIDMO_FLOW_BROWSER;
  if (configured && (await exists(configured))) {
    return { executablePath: configured, label: path.basename(configured) };
  }
  const candidates =
    process.platform === 'win32'
      ? [
          path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
          path.join(
            process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
            'Google\\Chrome\\Application\\chrome.exe',
          ),
          path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
          path.join(
            process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
            'Microsoft\\Edge\\Application\\msedge.exe',
          ),
          path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/microsoft-edge',
          ];
  for (const candidate of candidates) {
    if (candidate && (await exists(candidate))) {
      return { executablePath: candidate, label: path.basename(candidate) };
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Close a Chrome we launched ourselves, including its child processes. The
 * browser was started detached so it survives the VidMo server, which means we
 * have to terminate the whole tree by hand.
 */
function closeSpawnedBrowser(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } else {
      process.kill(-pid, 'SIGTERM');
    }
  } catch {
    /* the window was already closed */
  }
}

function abortError() {
  const error = new Error('Generation cancelled');
  error.code = 'generation_cancelled';
  error.name = 'AbortError';
  return error;
}

class FlowSession {
  constructor() {
    this.mode = process.env.VIDMO_FLOW_MODE === 'stub' ? 'stub' : 'browser';
    this.headless = process.env.VIDMO_FLOW_HEADLESS === '1';
    this.status = this.mode === 'stub' ? 'ready' : 'disconnected';
    this.message =
      this.mode === 'stub'
        ? 'Flow simulator is ready. It creates placeholder media without spending credits.'
        : 'Google Flow is not connected.';
    this.lastError = null;
    this.context = null;
    this.page = null;
    this.browser = null;
    this.spawnedPid = null;
    this.launchMode = 'playwright';
    this.browserLabel = null;
    this.monitor = null;
    this.monitoring = false;
    this.operationActive = false;
    this.attentionReason = null;
    this.pausedManually = false;
    this.activeProjectKey = null;
    this.connectedAt = null;
    this.lastInspection = null;
    this.latestScreenshot = null;
    this.connectPromise = null;
    this.lastHomeNudgeAt = 0;
  }

  get isStub() {
    return this.mode === 'stub';
  }

  async describe() {
    let available = this.mode === 'stub';
    let installNote = null;
    if (this.mode !== 'stub') {
      try {
        await loadPlaywright();
        available = true;
      } catch (error) {
        available = false;
        installNote = error.message;
      }
    }
    let screenshotUrl = null;
    if (this.latestScreenshot) {
      try {
        const stat = await fs.stat(this.latestScreenshot);
        screenshotUrl = `/api/flow/screenshot?t=${stat.mtimeMs}`;
      } catch {
        this.latestScreenshot = null;
      }
    }
    return {
      mode: this.mode,
      status: this.status,
      message: this.message,
      configured: available,
      playwrightInstalled: this.mode === 'stub' ? true : available,
      installNote,
      headless: this.headless,
      browser: this.browserLabel,
      launchMode: this.launchMode,
      flowUrl: FLOW_URL,
      profile: relativeDataPath(FLOW_PROFILE_DIR),
      connected: Boolean(this.context),
      connectedAt: this.connectedAt,
      attention: this.attentionReason,
      paused: this.pausedManually,
      currentProject: this.activeProjectKey,
      lastError: this.lastError,
      screenshotUrl,
      loginTimeoutMs: LOGIN_TIMEOUT_MS,
      url: this.page && !this.page.isClosed() ? this.page.url() : null,
      tabs: this.context
        ? this.context.pages().map((candidate) => {
            try {
              return candidate.url();
            } catch {
              return '(closed)';
            }
          })
        : [],
    };
  }

  setStatus(status, message) {
    this.status = status;
    if (message) this.message = message;
  }

  async connect({ consent = false } = {}) {
    if (this.mode === 'stub') {
      this.setStatus('ready', 'Flow simulator is ready.');
      return this.describe();
    }
    if (!consent) {
      throw new FlowError(
        'flow_consent_required',
        'Confirm that VidMo may open and automate your signed-in Flow browser session.',
        { statusCode: 400 },
      );
    }
    if (this.context) {
      await this.focus();
      return this.describe();
    }
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = this.launch();
    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  async launch() {
    this.setStatus('launching', 'Opening a visible Chrome window for Google Flow…');
    this.lastError = null;
    const { chromium } = await loadPlaywright();
    await fs.mkdir(FLOW_DIR, { recursive: true });
    await fs.mkdir(FLOW_PROFILE_DIR, { recursive: true });
    await fs.mkdir(DIAGNOSTICS_DIR, { recursive: true });

    const browser = await installedBrowser();

    // Preferred path: a real, non-automated Chrome that Google will accept for
    // sign-in. The Playwright-managed window below stays as a fallback for
    // environments where a local DevTools port is not available.
    if (CDP_ATTACH_ENABLED && !this.headless && browser?.executablePath) {
      try {
        return await this.attachToVisibleChrome({ chromium, browser });
      } catch (error) {
        this.lastError = error?.message || String(error);
        closeSpawnedBrowser(this.spawnedPid);
        this.spawnedPid = null;
      }
    }

    const baseOptions = {
      headless: this.headless,
      viewport: null,
      acceptDownloads: true,
      downloadsPath: path.join(FLOW_DIR, 'downloads'),
      locale: 'en-US',
      args: this.headless ? [] : ['--start-maximized'],
    };

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
        this.browserLabel = attempt.label;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!context) {
      this.lastError = lastError?.message || 'Unable to launch Chrome';
      this.setStatus(
        'error',
        `Could not launch a browser for Flow. Install Chrome/Edge or install Playwright browsers. ${this.lastError}`,
      );
      throw flowUnavailable(this.message);
    }

    this.context = context;
    this.context.on('close', () => {
      if (!this.context) return;
      this.context = null;
      this.page = null;
      this.stopMonitor();
      this.setStatus('disconnected', 'The Flow browser window was closed.');
    });

    this.page = context.pages()[0] ?? (await context.newPage());
    this.connectedAt = new Date().toISOString();
    this.activeProjectKey = null;
    this.setStatus('awaiting_login', 'Sign in to Google Flow in the Chrome window, then return here.');

    try {
      await this.page.goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    } catch (error) {
      this.lastError = error.message;
      this.setStatus(
        'attention',
        `Flow did not load cleanly (${error.message}). Check the browser window, then click Resume.`,
      );
      await this.screenshot({ label: 'load-failure' });
    }

    const inspection = await inspectFlowPage(this.page).catch(() => null);
    this.lastInspection = inspection;
    if (inspection?.state === 'ready' && inspection.onFlow) {
      this.setStatus('ready', 'Google Flow is signed in and ready.');
    } else {
      this.setStatus(
        'awaiting_login',
        'Sign in to your Google account in the Flow window. VidMo never sees or stores the password.',
      );
    }
    this.startMonitor();
    return this.describe();
  }

  /**
   * Launch Chrome the way a person would and attach to it over the DevTools
   * protocol. Without the automation flag Google accepts the sign-in, and the
   * session stays a normal browser profile that the user controls.
   */
  async attachToVisibleChrome({ chromium, browser }) {
    const endpoint = `http://127.0.0.1:${CDP_PORT}`;
    // A previous Flow window may still be open (for example after a server
    // restart). Reuse it rather than spawning a second browser on the profile.
    let existing = null;
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) {
        const version = await response.json();
        if (/chrome|edg/i.test(version?.Browser ?? '')) existing = version;
      }
    } catch {
      /* no browser on the debugging port yet */
    }

    if (!existing) {
      // Flow refuses to generate ("unusual activity") when extensions inject
      // scripts into its page, so the dedicated Flow profile starts without
      // extensions unless the user explicitly wants them.
      const extensionArgs =
        process.env.VIDMO_FLOW_ALLOW_EXTENSIONS === '1' ? [] : ['--disable-extensions'];
      const child = spawn(
        browser.executablePath,
        [
          `--remote-debugging-port=${CDP_PORT}`,
          `--user-data-dir=${FLOW_PROFILE_DIR}`,
          ...extensionArgs,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          FLOW_URL,
        ],
        { detached: true, stdio: 'ignore' },
      );
      child.unref();
      this.spawnedPid = child.pid ?? null;

      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline && !existing) {
        try {
          const response = await fetch(`${endpoint}/json/version`);
          if (response.ok) existing = await response.json();
        } catch {
          /* the DevTools endpoint is not up yet */
        }
        if (!existing && child.exitCode !== null) {
          throw new FlowError(
            'flow_cdp_unavailable',
            'The Chrome window closed before its debugging endpoint came up.',
            { statusCode: 502 },
          );
        }
        if (!existing) await sleep(400);
      }
    }
    if (!existing) {
      throw new FlowError(
        'flow_cdp_unavailable',
        'The Chrome window did not expose its local debugging endpoint.',
        { statusCode: 502 },
      );
    }

    const connection = await chromium.connectOverCDP(endpoint, { timeout: 20_000 });
    this.browser = connection;
    this.launchMode = 'attach';
    this.browserLabel = browser.label;
    this.context = connection.contexts()[0] ?? (await connection.newContext());
    connection.on('disconnected', () => {
      if (!this.browser) return;
      this.browser = null;
      this.context = null;
      this.page = null;
      this.spawnedPid = null;
      this.stopMonitor();
      this.setStatus('disconnected', 'The Flow browser window was closed.');
    });

    const pages = this.context.pages();
    this.page =
      pages.find((candidate) => /flow\.google\.com|labs\.google|accounts\.google/i.test(candidate.url())) ??
      pages[0] ??
      (await this.context.newPage());
    this.connectedAt = new Date().toISOString();
    this.activeProjectKey = null;
    this.setStatus('awaiting_login', 'Sign in to Google Flow in the Chrome window, then return here.');

    try {
      await this.page.goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    } catch (error) {
      this.lastError = error.message;
      this.setStatus(
        'attention',
        `Flow did not load cleanly (${error.message}). Check the browser window, then click Resume.`,
      );
      await this.screenshot({ label: 'load-failure' });
    }

    const inspection = await inspectFlowPage(this.page).catch(() => null);
    this.lastInspection = inspection;
    if (inspection?.state === 'ready' && inspection.onFlow) {
      this.setStatus('ready', 'Google Flow is signed in and ready.');
    } else {
      await this.gotoSignIn().catch(() => {});
      this.setStatus(
        'awaiting_login',
        'Sign in to your Google account in the Flow window. VidMo never sees or stores the password.',
      );
    }
    this.startMonitor();
    return this.describe();
  }

  /**
   * Walk the attached window to Google's own sign-in entry. This is the same
   * page Flow's "Sign in" control leads to; the user types the password there
   * and VidMo only navigates — it never reads the credentials.
   */
  async gotoSignIn() {
    if (!this.page || this.page.isClosed()) return false;
    if (/accounts\.google\.com/i.test(this.page.url())) return true;
    try {
      await this.page.goto(SIGN_IN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    } catch (error) {
      this.lastError = error?.message ?? String(error);
      return false;
    }
    return true;
  }

  startMonitor() {
    if (this.monitor) return;
    this.monitor = setInterval(() => {
      this.monitorTick().catch(() => {});
    }, 3000);
    this.monitor.unref?.();
  }

  stopMonitor() {
    if (this.monitor) clearInterval(this.monitor);
    this.monitor = null;
  }

  async monitorTick() {
    if (!this.page || this.page.isClosed()) {
      if (this.context) {
        this.setStatus('disconnected', 'The Flow browser window was closed.');
        this.context = null;
        this.page = null;
      }
      this.stopMonitor();
      return;
    }
    if (this.monitoring || this.operationActive || this.attentionReason) return;
    this.monitoring = true;
    try {
      const inspection = await inspectFlowPage(this.page);
      this.lastInspection = inspection;
      if (inspection.blocked && inspection.blocked.kind !== 'failure') {
        this.setStatus('attention', inspection.blocked.message);
        this.attentionReason = inspection.blocked.message;
        return;
      }
      if (inspection.state === 'ready') {
        this.setStatus('ready', 'Google Flow is signed in and ready.');
      } else if (inspection.state === 'awaiting_login') {
        // A signed-in user can still land on Flow's public marketing page; walk
        // them back into the app without interrupting a Google sign-in page.
        if (
          inspection.isMarketing &&
          !inspection.signInVisible &&
          Date.now() - this.lastHomeNudgeAt > 30_000
        ) {
          this.lastHomeNudgeAt = Date.now();
          await this.page
            .goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })
            .catch(() => {});
        }
        this.setStatus(
          'awaiting_login',
          'Waiting for Google sign-in. Complete it in the visible Flow window; VidMo will detect it automatically.',
        );
      } else if (inspection.onFlow) {
        this.setStatus('ready', 'Google Flow is open.');
      }
    } finally {
      this.monitoring = false;
    }
  }

  async focus() {
    if (!this.page || this.page.isClosed()) {
      throw new FlowError('flow_not_connected', 'Open Google Flow first.', { statusCode: 409 });
    }
    await this.page.bringToFront().catch(() => {});
    return this.describe();
  }

  async ensureReady({ signal, onWait } = {}) {
    if (this.mode === 'stub') return;
    if (!this.context || !this.page || this.page.isClosed()) {
      throw new FlowError('flow_not_connected', 'Connect Google Flow before generating media.', {
        statusCode: 409,
      });
    }
    const started = Date.now();
    let lastNotice = 0;
    while (true) {
      if (signal?.aborted) throw abortError();
      if (this.attentionReason) {
        throw new FlowError('flow_needs_attention', this.attentionReason, {
          statusCode: 409,
          details: { attention: true },
        });
      }
      if (this.status === 'error') {
        throw new FlowError('flow_error', this.message || 'Flow is in an error state.', {
          statusCode: 502,
        });
      }
      if (this.status === 'ready') return;
      if (this.status === 'awaiting_login') {
        if (Date.now() - started > LOGIN_TIMEOUT_MS) {
          throw new FlowError(
            'flow_login_timeout',
            'Flow is still waiting for Google sign-in. Sign in in the browser window and reconnect.',
            { statusCode: 409 },
          );
        }
        if (onWait && Date.now() - lastNotice > 4000) {
          lastNotice = Date.now();
          onWait('Waiting for Google sign-in in the Flow window…');
        }
      }
      if (this.status === 'busy' && !this.operationActive) {
        this.setStatus('ready', 'Google Flow is ready.');
      }
      await sleep(800);
    }
  }

  async startProject(projectId, title = '', onProgress) {
    if (this.mode === 'stub') return;
    if (!this.page || this.page.isClosed()) {
      throw new FlowError('flow_not_connected', 'Open Google Flow first.', { statusCode: 409 });
    }
    if (this.activeProjectKey === projectId) {
      const selectors = await loadSelectors();
      const prompt = await findFirst(this.page, selectors.prompt, { timeout: 500 });
      if (prompt) return;
    }

    onProgress?.('Opening Google Flow…');
    await this.page.goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const selectors = await loadSelectors();
    // Wait until either the composer or the "New project" button is on screen.
    await findFirst(
      this.page,
      [...selectors.prompt, ...selectors.newProject],
      { timeout: 10_000 },
    );
    let prompt = await findFirst(this.page, selectors.prompt, { timeout: 800 });

    if (!prompt) {
      onProgress?.('Creating a Flow project for this film…');
      const newProject = await findFirst(this.page, selectors.newProject, { timeout: 3000 });
      if (newProject) {
        await newProject.click({ timeout: 8000 }).catch(() => {});
        prompt = await findFirst(this.page, selectors.prompt, { timeout: 20_000 });
      }
    }
    if (!prompt) {
      await this.captureDiagnostics().catch(() => {});
      throw new FlowError(
        'flow_project_open_failed',
        'Flow’s composer did not appear, so the generation was stopped. Capture diagnostics from the Flow panel and try again.',
        { statusCode: 502 },
      );
    }
    this.activeProjectKey = projectId;
    this.setStatus('busy', `Flow project ready${title ? ` for ${title}` : ''}.`);
  }

  async runExclusive(task) {
    if (this.mode === 'stub') return task();
    if (this.operationActive) throw new FlowBusyError();
    this.operationActive = true;
    this.setStatus('busy', 'Google Flow is generating…');
    try {
      return await task();
    } finally {
      this.operationActive = false;
      if (!this.context || !this.page || this.page.isClosed()) {
        this.setStatus('disconnected', 'The Flow browser window was closed.');
      } else if (this.attentionReason) {
        this.setStatus('attention', this.attentionReason);
      } else {
        this.setStatus('ready', 'Google Flow is ready.');
      }
    }
  }

  async requestAttention(reason) {
    this.attentionReason = reason;
    this.setStatus('attention', reason);
    await this.screenshot({ label: 'attention' });
  }

  async waitForManual(reason, { signal, timeoutMs = ATTENTION_TIMEOUT_MS, onWait } = {}) {
    this.attentionReason = reason;
    this.setStatus('attention', reason);
    await this.screenshot({ label: 'manual-action' });
    const started = Date.now();
    let lastNotice = 0;
    while (this.attentionReason || this.pausedManually) {
      if (signal?.aborted) throw abortError();
      if (!this.context || !this.page || this.page.isClosed()) {
        throw new FlowError('flow_disconnected', 'The Flow browser window was closed.', {
          statusCode: 409,
        });
      }
      if (Date.now() - started > timeoutMs) {
        throw new FlowAutomationError(
          'Flow is still waiting for you. Resolve the prompt in the Flow window, then resume generation.',
          { step: 'manual-action', reason },
        );
      }
      if (onWait && Date.now() - lastNotice > 5000) {
        lastNotice = Date.now();
        onWait(reason);
      }
      await sleep(900);
    }
    this.setStatus(this.operationActive ? 'busy' : 'ready', 'Continuing in Google Flow…');
  }

  async pause(reason = 'Paused by you. Resolve anything in the Flow window, then resume.') {
    this.pausedManually = true;
    this.attentionReason = reason;
    this.setStatus('attention', reason);
    await this.screenshot({ label: 'paused' });
    return this.describe();
  }

  async resume() {
    this.pausedManually = false;
    this.attentionReason = null;
    this.setStatus(this.operationActive ? 'busy' : 'ready', this.operationActive ? 'Continuing in Google Flow…' : 'Google Flow is ready.');
    return this.describe();
  }

  async screenshot({ label = 'flow' } = {}) {
    if (!this.page || this.page.isClosed()) return null;
    try {
      await fs.mkdir(DIAGNOSTICS_DIR, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeLabel = String(label).replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40) || 'flow';
      const file = path.join(DIAGNOSTICS_DIR, `${stamp}-${safeLabel}.png`);
      await this.page.screenshot({ path: file, fullPage: false });
      await fs.copyFile(file, path.join(DIAGNOSTICS_DIR, 'latest.png'));
      this.latestScreenshot = path.join(DIAGNOSTICS_DIR, 'latest.png');
      return file;
    } catch {
      return null;
    }
  }

  async captureDiagnostics() {
    if (!this.page || this.page.isClosed()) {
      throw new FlowError('flow_not_connected', 'Open Google Flow before capturing diagnostics.', {
        statusCode: 409,
      });
    }
    const screenshotPath = await this.screenshot({ label: 'diagnostics' });
    const pageInfo = await this.page
      .evaluate(() => {
        const selector =
          'button, a, input, textarea, select, [role="button"], [role="menuitem"], [role="option"], [contenteditable="true"]';
        const elements = [...document.querySelectorAll(selector)]
          .slice(0, 500)
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
                element.innerText?.trim().slice(0, 160) ||
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
            };
          });
        return {
          title: document.title,
          url: location.href,
          bodyText: (document.body?.innerText ?? '').slice(0, 15_000),
          elements,
        };
      })
      .catch(() => ({ title: '', url: this.page.url(), bodyText: '', elements: [] }));
    const aria = await this.page
      .locator('body')
      .ariaSnapshot({ timeout: 5000 })
      .catch(() => '');
    const savedAt = new Date().toISOString();
    const payload = {
      savedAt,
      mode: this.mode,
      status: this.status,
      message: this.message,
      attention: this.attentionReason,
      inspection: this.lastInspection,
      screenshot: path.basename(screenshotPath ?? ''),
      aria: String(aria).slice(0, 40_000),
      ...pageInfo,
    };
    await fs.mkdir(DIAGNOSTICS_DIR, { recursive: true });
    const file = path.join(DIAGNOSTICS_DIR, `flow-diagnostics-${savedAt.replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8');
    await fs.writeFile(path.join(DIAGNOSTICS_DIR, 'latest.json'), JSON.stringify(payload, null, 2), 'utf8');
    return {
      ok: true,
      savedAt,
      file: relativeDataPath(file),
      screenshotUrl: screenshotPath ? `/api/flow/screenshot?t=${Date.now()}` : null,
      url: pageInfo.url,
      title: pageInfo.title,
      elementCount: pageInfo.elements?.length ?? 0,
      visibleElements: (pageInfo.elements ?? []).filter((item) => item.visible).length,
      bodyText: visualPreview(pageInfo.bodyText),
      elements: (pageInfo.elements ?? []).filter((item) => item.visible).slice(0, 30),
      message: 'Diagnostics saved locally. Nothing was uploaded.',
    };
  }

  screenshotPath() {
    return this.latestScreenshot;
  }

  async disconnect({ clearProfile = false } = {}) {
    this.stopMonitor();
    const browser = this.browser;
    const context = this.context;
    const spawnedPid = this.spawnedPid;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.spawnedPid = null;
    this.activeProjectKey = null;
    this.connectedAt = null;
    this.attentionReason = null;
    this.pausedManually = false;
    this.launchMode = 'playwright';
    if (browser) {
      // Attached over CDP: closing the connection may leave the window open, so
      // the spawned browser is terminated explicitly before the profile is
      // reused or cleared.
      await browser.close().catch(() => {});
    } else if (context) {
      await context.close().catch(() => {});
    }
    if (spawnedPid) {
      closeSpawnedBrowser(spawnedPid);
      await sleep(400);
    }
    this.setStatus('disconnected', 'Google Flow is not connected.');
    if (clearProfile) {
      await fs.mkdir(FLOW_PROFILE_DIR, { recursive: true });
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          await fs.rm(FLOW_PROFILE_DIR, { recursive: true, force: true });
          break;
        } catch {
          await sleep(400);
        }
      }
      this.setStatus(
        'disconnected',
        'Google Flow is disconnected and the local browser profile was cleared.',
      );
    }
    return this.describe();
  }
}

function visualPreview(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 14)
    .join('\n')
    .slice(0, 1800);
}

export const flowSession = new FlowSession();
export { FLOW_URL };
