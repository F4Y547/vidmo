import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

import { getAudience } from '../engine/audiences.js';
import { AUDIENCE_LIST } from '../engine/audiences.js';
import { buildDishSelection, buildIdeaBoard, buildStageReroll, buildStoryboard } from '../engine/project.js';
import { analyzeCustomDish } from '../engine/custom.js';
import { auditStage, auditStoryboard } from '../engine/prompts.js';
import {
  buildContinuityMarkdown,
  buildMarkdown,
  buildPackReadme,
  buildProjectJson,
  buildRenderHandoff,
  buildShotListCsv,
  buildSocialMarkdown,
  projectExportName,
} from '../engine/exports.js';
import { getAiStatus, planCustomDishWithAI } from './ai.js';
import { readStore, transact } from './store.js';
import { createZip } from './zip.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..', 'web');
const APP_VERSION = '1.0.0';
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const VIDEO_MODELS = ['Google Veo 3.1', 'Kling 2.5', 'Runway Gen-4', 'Sora 2'];

class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function baseHeaders(contentType) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    ...baseHeaders('application/json; charset=utf-8'),
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, error) {
  const statusCode = error.statusCode ?? 500;
  const payload = {
    error: error.code ?? 'internal_error',
    message: error.message || 'Something went wrong',
  };
  if (error.details) payload.details = error.details;
  sendJson(res, statusCode, payload);
}

function sendEmpty(res, statusCode = 204) {
  res.writeHead(statusCode, baseHeaders());
  res.end();
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, 'payload_too_large', 'Request body is too large');
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON');
  }
}

function cleanText(value, maxLength = 100_000) {
  return String(value ?? '').slice(0, maxLength);
}

function makeId() {
  return `film_${crypto.randomBytes(5).toString('hex')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function audienceMeta(audienceId) {
  const audience = getAudience(audienceId);
  return {
    id: audience.id,
    option: audience.option,
    label: audience.label,
    shortLabel: audience.shortLabel,
    region: audience.region,
    tagline: audience.tagline,
    description: audience.description,
    environmentShort: audience.environmentShort,
    handsShort: audience.handsShort,
    palette: audience.palette,
  };
}

function projectSummary(project) {
  let fallbackAudience = null;
  try {
    fallbackAudience = getAudience(project.audience);
  } catch {
    fallbackAudience = null;
  }
  return {
    id: project.id,
    title: project.title,
    audience: project.audience,
    audienceLabel: fallbackAudience?.shortLabel ?? project.audience,
    dishName: project.dish?.name ?? null,
    dishEmoji: project.dish?.emoji ?? null,
    status: project.status,
    stageCount: project.storyboard?.totalStages ?? project.dish?.stages?.length ?? 0,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
    accent: project.dish?.accent ?? fallbackAudience?.palette?.[0] ?? '#e0a458',
  };
}

function serializeProject(project) {
  return project;
}

function findProject(store, id) {
  const project = store.projects.find((item) => item.id === id);
  if (!project) throw new HttpError(404, 'project_not_found', 'Project not found');
  return project;
}

function ensureStoryboard(project) {
  if (!project.storyboard) {
    throw new HttpError(409, 'storyboard_missing', 'Generate the storyboard first');
  }
  return project.storyboard;
}

function getRenderConfig() {
  const webhook = process.env.VIDMO_RENDER_WEBHOOK || '';
  let host = null;
  if (webhook) {
    try {
      host = new URL(webhook).host;
    } catch {
      host = 'invalid-url';
    }
  }
  return {
    configured: Boolean(webhook),
    webhookHost: host,
    callbackConfigured: Boolean(process.env.VIDMO_PUBLIC_URL),
    note: webhook
      ? 'Render webhook is configured. Stage jobs can be submitted to your renderer.'
      : 'No render webhook configured. Export the render pack or set VIDMO_RENDER_WEBHOOK to automate submission.',
  };
}

function getSettings(store) {
  return {
    defaultVideoModel:
      store.settings?.defaultVideoModel && VIDEO_MODELS.includes(store.settings.defaultVideoModel)
        ? store.settings.defaultVideoModel
        : VIDEO_MODELS[0],
    videoModels: VIDEO_MODELS,
  };
}

async function getBootstrap() {
  const store = await readStore();
  return {
    app: {
      name: 'VidMo Studio',
      version: APP_VERSION,
      tagline: 'Miniature cooking films, shot by shot.',
    },
    audiences: AUDIENCE_LIST.map((audience) => ({
      id: audience.id,
      option: audience.option,
      label: audience.label,
      shortLabel: audience.shortLabel,
      region: audience.region,
      tagline: audience.tagline,
      description: audience.description,
      environmentShort: audience.environmentShort,
      handsShort: audience.handsShort,
      palette: audience.palette,
      cardRules: audience.cardRules,
    })),
    projects: [...store.projects]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .map(projectSummary),
    ai: getAiStatus(),
    render: getRenderConfig(),
    settings: getSettings(store),
  };
}

function buildPackFiles(project) {
  const storyboard = project.storyboard;
  const files = [
    { name: 'README.txt', data: buildPackReadme(project) },
    { name: 'project.md', data: buildMarkdown(project) },
    { name: 'manifest.json', data: buildProjectJson(project) },
    { name: 'continuity-bible.md', data: buildContinuityMarkdown(project) },
    { name: 'negative-prompt.txt', data: storyboard.negativePrompt },
    { name: 'thumbnail-prompt.txt', data: storyboard.thumbnailPrompt },
    { name: 'shot-list.csv', data: buildShotListCsv(project) },
    { name: 'social-copy.md', data: buildSocialMarkdown(project) },
    { name: 'render-handoff.json', data: JSON.stringify(buildRenderHandoff(project), null, 2) },
  ];

  for (const [index, stage] of storyboard.stages.entries()) {
    const number = String(index + 1).padStart(2, '0');
    files.push({ name: `stage-${number}-image.txt`, data: stage.imagePrompt });
    files.push({ name: `stage-${number}-motion.txt`, data: stage.motionPrompt });
    files.push({ name: `stage-${number}-audio.txt`, data: stage.audioPrompt });
    files.push({ name: `stage-${number}-negative.txt`, data: stage.negativePrompt });
  }
  return files;
}

function buildExport(project, format) {
  const base = projectExportName(project);
  if (format === 'md') {
    return {
      filename: `${base}.md`,
      contentType: 'text/markdown; charset=utf-8',
      data: buildMarkdown(project),
    };
  }
  if (format === 'json') {
    return {
      filename: `${base}.json`,
      contentType: 'application/json; charset=utf-8',
      data: buildProjectJson(project),
    };
  }
  if (format === 'csv') {
    return {
      filename: `${base}-shot-list.csv`,
      contentType: 'text/csv; charset=utf-8',
      data: buildShotListCsv(project),
    };
  }
  if (format === 'handoff') {
    return {
      filename: `${base}-render-handoff.json`,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(buildRenderHandoff(project), null, 2),
    };
  }
  if (format === 'zip') {
    return {
      filename: `${base}-pack.zip`,
      contentType: 'application/zip',
      data: createZip(buildPackFiles(project)),
    };
  }
  throw new HttpError(400, 'unsupported_format', 'Format must be md, json, csv, handoff or zip');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
  }
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('\0')) throw new HttpError(400, 'bad_path', 'Invalid path');
  const requested = decoded === '/' ? '/index.html' : decoded;
  let filePath = path.resolve(WEB_ROOT, `.${requested}`);
  if (filePath !== WEB_ROOT && !filePath.startsWith(`${WEB_ROOT}${path.sep}`)) {
    throw new HttpError(403, 'forbidden', 'Forbidden');
  }

  let data;
  try {
    data = await fs.readFile(filePath);
  } catch (error) {
    if (error.code === 'ENOENT' && !path.extname(requested)) {
      filePath = path.join(WEB_ROOT, 'index.html');
      data = await fs.readFile(filePath);
    } else {
      throw new HttpError(404, 'not_found', 'File not found');
    }
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';
  res.writeHead(200, {
    ...baseHeaders(contentType),
    'Cache-Control': extension === '.html' ? 'no-store' : 'public, max-age=0, must-revalidate',
    'Content-Length': data.length,
  });
  if (req.method === 'HEAD') res.end();
  else res.end(data);
}

async function handleCreateProject(req, res) {
  const body = await readJson(req);
  if (!body.audience || !['western', 'desi'].includes(body.audience)) {
    throw new HttpError(400, 'invalid_audience', 'Choose audience "western" or "desi"');
  }
  const board = buildIdeaBoard(body.audience);
  const createdAt = nowIso();
  const project = {
    id: makeId(),
    title: 'New miniature film',
    audience: body.audience,
    audienceMeta: audienceMeta(body.audience),
    ideas: board.ideas,
    dish: null,
    analysis: null,
    storyboard: null,
    status: 'ideas',
    activeStep: 2,
    rerolls: 0,
    planningNote: `10 ${board.audience.shortLabel} dish ideas ready. Select one or enter a custom dish.`,
    render: { status: 'not-submitted', jobs: [] },
    createdAt,
    updatedAt: createdAt,
  };
  await transact((store) => {
    store.projects.unshift(project);
  });
  sendJson(res, 201, { project: serializeProject(project), ideas: board.ideas, audience: board.audience });
}

async function handleGetProject(req, res, id) {
  const store = await readStore();
  const project = findProject(store, id);
  sendJson(res, 200, { project: serializeProject(project) });
}

async function handleDeleteProject(req, res, id) {
  await transact((store) => {
    const index = store.projects.findIndex((project) => project.id === id);
    if (index < 0) throw new HttpError(404, 'project_not_found', 'Project not found');
    store.projects.splice(index, 1);
  });
  sendEmpty(res);
}

async function handleSelectDish(req, res, id) {
  const body = await readJson(req);
  const store = await readStore();
  const existing = findProject(store, id);
  const audienceId = existing.audience;
  const dishId = cleanText(body.dishId, 120);
  const customName = cleanText(
    typeof body.customDish === 'object' ? body.customDish?.name : body.customDish || body.customName,
    160,
  ).trim();
  const customIngredients =
    typeof body.customDish === 'object'
      ? body.customDish?.ingredients
      : body.ingredients || '';

  let selection;
  let planningNote = '';
  const isCustom = dishId === 'custom' || Boolean(customName);

  if (isCustom) {
    if (!customName) {
      throw new HttpError(400, 'custom_dish_required', 'Enter a custom dish name');
    }
    if (body.useAi && getAiStatus().configured) {
      try {
        selection = await planCustomDishWithAI({
          name: customName,
          ingredients: customIngredients,
          audienceId,
        });
        planningNote = `AI recipe planner built ${selection.dish.stages.length} stages using ${getAiStatus().model}. The locked prompt engine wrote every image, motion and audio prompt.`;
      } catch (error) {
        selection = buildDishSelection({
          audienceId,
          dishId: 'custom',
          customDish: { name: customName, ingredients: customIngredients },
        });
        planningNote = `AI planner unavailable (${error.message}). The local recipe analyzer built the stage plan instead.`;
      }
    } else {
      selection = buildDishSelection({
        audienceId,
        dishId: 'custom',
        customDish: { name: customName, ingredients: customIngredients },
      });
      planningNote = `Local recipe analyzer · ${selection.analysis.complexityLabel} · ${selection.dish.stages.length} stages. ${body.useAi ? 'AI planner is not configured.' : ''}`.trim();
    }
  } else {
    if (!dishId) throw new HttpError(400, 'dish_required', 'Select a dish');
    selection = buildDishSelection({ audienceId, dishId });
    planningNote = `Library recipe plan · ${selection.analysis.complexityLabel} · ${selection.dish.stages.length} stages.`;
  }

  const updated = await transact((transactionStore) => {
    const project = findProject(transactionStore, id);
    project.dish = selection.dish;
    project.analysis = selection.analysis;
    project.title = `${selection.dish.name} · ${getAudience(project.audience).shortLabel}`;
    project.storyboard = null;
    project.status = 'breakdown';
    project.activeStep = 3;
    project.planningNote = planningNote;
    project.selectedAt = nowIso();
    project.updatedAt = nowIso();
    project.render = { status: 'not-submitted', jobs: [] };
    return project;
  });

  sendJson(res, 200, { project: serializeProject(updated) });
}

async function handleAnalyze(req, res) {
  const body = await readJson(req);
  const name = cleanText(body.name, 160).trim();
  const audienceId = body.audience;
  if (!name) throw new HttpError(400, 'name_required', 'Enter a dish name');
  if (!['western', 'desi'].includes(audienceId)) {
    throw new HttpError(400, 'invalid_audience', 'Choose audience "western" or "desi"');
  }
  const analysis = analyzeCustomDish({
    name,
    ingredients: body.ingredients || '',
    audienceId,
  });
  sendJson(res, 200, { analysis });
}

async function handleStoryboard(req, res, id) {
  const body = await readJson(req);
  const project = await transact((store) => {
    const target = findProject(store, id);
    if (!target.dish) throw new HttpError(409, 'dish_missing', 'Select a dish first');
    const requestedSeed = Number(body.variantSeed);
    const variantSeed = Number.isFinite(requestedSeed)
      ? Math.max(0, Math.floor(requestedSeed))
      : target.storyboard?.variantSeed ?? target.rerolls ?? 0;
    target.storyboard = buildStoryboard({ project: target, variantSeed });
    target.status = 'storyboard';
    target.activeStep = 4;
    target.storyboardReadyAt = nowIso();
    target.updatedAt = nowIso();
    return target;
  });
  sendJson(res, 200, { project: serializeProject(project) });
}

async function handleUpdateStage(req, res, id, stageIndex) {
  const body = await readJson(req);
  const project = await transact((store) => {
    const target = findProject(store, id);
    const storyboard = ensureStoryboard(target);
    const stage = storyboard.stages[stageIndex];
    if (!stage) throw new HttpError(404, 'stage_not_found', `Stage ${stageIndex + 1} does not exist`);

    const editable = ['imagePrompt', 'motionPrompt', 'audioPrompt', 'negativePrompt'];
    let changed = false;
    for (const field of editable) {
      if (typeof body[field] === 'string' && body[field] !== stage[field]) {
        stage[field] = cleanText(body[field], 40_000);
        changed = true;
      }
    }
    if (!changed) {
      throw new HttpError(400, 'no_changes', 'Provide at least one prompt field to update');
    }
    stage.editedAt = nowIso();
    stage.userEdited = true;
    stage.compliance = auditStage({
      audienceId: target.audience,
      dish: target.dish,
      stage,
      index: stageIndex,
      total: storyboard.stages.length,
    });
    storyboard.audit = auditStoryboard({
      audienceId: target.audience,
      dish: target.dish,
      stages: storyboard.stages,
    });
    target.updatedAt = nowIso();
    return target;
  });
  sendJson(res, 200, { project: serializeProject(project) });
}

async function handleRerollStage(req, res, id, stageIndex) {
  const project = await transact((store) => {
    const target = findProject(store, id);
    const storyboard = ensureStoryboard(target);
    const existing = storyboard.stages[stageIndex];
    if (!existing) throw new HttpError(404, 'stage_not_found', `Stage ${stageIndex + 1} does not exist`);
    target.rerolls = Number(target.rerolls || 0) + 1;
    const reroll = buildStageReroll({
      project: target,
      stageIndex,
      variantSeed: target.rerolls,
    });
    storyboard.stages = reroll.stages;
    storyboard.audit = reroll.audit;
    storyboard.lastRerollAt = nowIso();
    storyboard.lastRerollStage = stageIndex + 1;
    target.updatedAt = nowIso();
    return target;
  });
  sendJson(res, 200, { project: serializeProject(project) });
}

async function handleExport(req, res, id, url) {
  const format = (url.searchParams.get('format') || 'md').toLowerCase();
  const store = await readStore();
  const project = findProject(store, id);
  ensureStoryboard(project);
  const bundle = buildExport(project, format);
  res.writeHead(200, {
    ...baseHeaders(bundle.contentType),
    'Content-Disposition': `attachment; filename="${bundle.filename}"`,
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.isBuffer(bundle.data)
      ? bundle.data.length
      : Buffer.byteLength(bundle.data),
  });
  res.end(bundle.data);
}

async function handleRender(req, res, id) {
  const webhook = process.env.VIDMO_RENDER_WEBHOOK;
  if (!webhook) {
    throw new HttpError(
      409,
      'render_bridge_unconfigured',
      'Set VIDMO_RENDER_WEBHOOK to submit shots automatically, or download the render pack.',
    );
  }
  const store = await readStore();
  const project = findProject(store, id);
  ensureStoryboard(project);
  const handoff = buildRenderHandoff(project);
  const callbackUrl = process.env.VIDMO_PUBLIC_URL
    ? `${process.env.VIDMO_PUBLIC_URL.replace(/\/+$/, '')}/api/render/callback`
    : undefined;
  let response;
  try {
    response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.VIDMO_RENDER_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.VIDMO_RENDER_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ ...handoff, callbackUrl }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new HttpError(502, 'render_bridge_failed', `Render bridge request failed: ${error.message}`);
  }
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new HttpError(
      502,
      'render_bridge_failed',
      `Render bridge returned ${response.status}${details ? `: ${details.slice(0, 300)}` : ''}`,
    );
  }
  let remote = {};
  try {
    remote = await response.json();
  } catch {
    remote = {};
  }
  const updated = await transact((transactionStore) => {
    const target = findProject(transactionStore, id);
    target.render = {
      status: 'queued',
      submittedAt: nowIso(),
      responseStatus: response.status,
      remoteId: remote.id ?? remote.jobId ?? null,
      jobs: target.storyboard.stages.map((stage) => ({
        stageId: stage.id,
        status: 'queued',
        updatedAt: nowIso(),
      })),
    };
    target.updatedAt = nowIso();
    return target;
  });
  sendJson(res, 202, { project: serializeProject(updated), render: updated.render });
}

async function handleRenderCallback(req, res) {
  const secret = process.env.VIDMO_RENDER_CALLBACK_SECRET;
  if (secret) {
    const provided = req.headers['x-vidmo-secret'];
    if (provided !== secret) {
      throw new HttpError(401, 'invalid_callback_secret', 'Invalid callback secret');
    }
  }
  const body = await readJson(req);
  const projectId = cleanText(body.projectId, 80);
  const stageId = cleanText(body.stageId, 20);
  const status = cleanText(body.status || 'updated', 40);
  if (!projectId) throw new HttpError(400, 'project_required', 'projectId is required');

  const updated = await transact((store) => {
    const project = findProject(store, projectId);
    if (!project.storyboard) throw new HttpError(409, 'storyboard_missing', 'Project has no storyboard');
    project.render = project.render || { jobs: [] };
    project.render.jobs = Array.isArray(project.render.jobs) ? project.render.jobs : [];
    const job = project.render.jobs.find((item) => item.stageId === stageId);
    const nextJob = {
      stageId,
      status,
      videoUrl: body.videoUrl ? cleanText(body.videoUrl, 2000) : undefined,
      imageUrl: body.imageUrl ? cleanText(body.imageUrl, 2000) : undefined,
      message: body.message ? cleanText(body.message, 1000) : undefined,
      updatedAt: nowIso(),
    };
    if (job) Object.assign(job, nextJob);
    else project.render.jobs.push(nextJob);

    const statuses = project.storyboard.stages.map(
      (stage) => project.render.jobs.find((item) => item.stageId === stage.id)?.status ?? 'pending',
    );
    if (statuses.some((value) => value === 'failed')) project.render.status = 'attention';
    else if (statuses.every((value) => value === 'complete')) project.render.status = 'complete';
    else project.render.status = 'in-progress';
    project.updatedAt = nowIso();
    return project;
  });
  sendJson(res, 202, { ok: true, render: updated.render });
}

async function handleSettings(req, res) {
  if (req.method === 'GET') {
    const store = await readStore();
    sendJson(res, 200, { settings: getSettings(store), ai: getAiStatus(), render: getRenderConfig() });
    return;
  }
  if (req.method !== 'PATCH') {
    throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
  }
  const body = await readJson(req);
  const model = cleanText(body.defaultVideoModel, 80);
  if (!VIDEO_MODELS.includes(model)) {
    throw new HttpError(400, 'invalid_model', `Model must be one of: ${VIDEO_MODELS.join(', ')}`);
  }
  const settings = await transact((store) => {
    store.settings = { ...(store.settings ?? {}), defaultVideoModel: model };
    return getSettings(store);
  });
  sendJson(res, 200, { settings });
}

async function route(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    sendEmpty(res, 204);
    return;
  }

  if (pathname === '/api/health' && method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      app: 'VidMo Studio',
      version: APP_VERSION,
      time: nowIso(),
      renderConfigured: getRenderConfig().configured,
      aiConfigured: getAiStatus().configured,
    });
    return;
  }

  if (pathname === '/api/bootstrap' && method === 'GET') {
    sendJson(res, 200, await getBootstrap());
    return;
  }

  if (pathname === '/api/ai/status' && method === 'GET') {
    sendJson(res, 200, { ai: getAiStatus() });
    return;
  }

  if (pathname === '/api/settings' && (method === 'GET' || method === 'PATCH')) {
    await handleSettings(req, res);
    return;
  }

  if (pathname === '/api/analyze' && method === 'POST') {
    await handleAnalyze(req, res);
    return;
  }

  if (pathname === '/api/render/callback' && method === 'POST') {
    await handleRenderCallback(req, res);
    return;
  }

  if (pathname === '/api/projects' && method === 'GET') {
    const store = await readStore();
    sendJson(res, 200, {
      projects: [...store.projects]
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .map(projectSummary),
    });
    return;
  }

  if (pathname === '/api/projects' && method === 'POST') {
    await handleCreateProject(req, res);
    return;
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) {
    const id = decodeURIComponent(projectMatch[1]);
    if (method === 'GET') {
      await handleGetProject(req, res, id);
      return;
    }
    if (method === 'DELETE') {
      await handleDeleteProject(req, res, id);
      return;
    }
    throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
  }

  const selectMatch = pathname.match(/^\/api\/projects\/([^/]+)\/select$/);
  if (selectMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleSelectDish(req, res, decodeURIComponent(selectMatch[1]));
    return;
  }

  const storyboardMatch = pathname.match(/^\/api\/projects\/([^/]+)\/storyboard$/);
  if (storyboardMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleStoryboard(req, res, decodeURIComponent(storyboardMatch[1]));
    return;
  }

  const stageMatch = pathname.match(/^\/api\/projects\/([^/]+)\/stage\/(\d+)$/);
  if (stageMatch) {
    if (method !== 'PATCH') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleUpdateStage(
      req,
      res,
      decodeURIComponent(stageMatch[1]),
      Number(stageMatch[2]) - 1,
    );
    return;
  }

  const rerollMatch = pathname.match(/^\/api\/projects\/([^/]+)\/stage\/(\d+)\/reroll$/);
  if (rerollMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleRerollStage(
      req,
      res,
      decodeURIComponent(rerollMatch[1]),
      Number(rerollMatch[2]) - 1,
    );
    return;
  }

  const exportMatch = pathname.match(/^\/api\/projects\/([^/]+)\/export$/);
  if (exportMatch) {
    if (method !== 'GET') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleExport(req, res, decodeURIComponent(exportMatch[1]), url);
    return;
  }

  const renderMatch = pathname.match(/^\/api\/projects\/([^/]+)\/render$/);
  if (renderMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleRender(req, res, decodeURIComponent(renderMatch[1]));
    return;
  }

  if (pathname.startsWith('/api/')) {
    throw new HttpError(404, 'not_found', 'API endpoint not found');
  }

  await serveStatic(req, res, pathname);
}

export async function handleRequest(req, res) {
  try {
    await route(req, res);
  } catch (error) {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    if (!(error instanceof HttpError)) {
      console.error('[VidMo]', error);
    }
    sendError(res, error);
  }
}
