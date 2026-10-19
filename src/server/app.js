import { promises as fs, createWriteStream, createReadStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
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
import { buildFlowPackFiles } from '../engine/flow.js';
import { getAiStatus, planCustomDishWithAI } from './ai.js';
import { readStore, transact } from './store.js';
import { createZip } from './zip.js';
import { flowSession } from './flow/session.js';
import {
  decorateProject,
  generationManager,
  GenerationError,
} from './generation.js';
import {
  MAX_UPLOAD_BYTES,
  assetFilePath,
  createUploadTempPath,
  isAllowedMediaFile,
  mediaContentType,
  removeProjectMedia,
} from './media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..', 'web');
const APP_VERSION = '1.1.0';
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
      "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
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
  const stageGenerations = Object.values(project.generation?.stages ?? {});
  const imagesGenerated = stageGenerations.reduce((sum, stage) => sum + (stage.images?.length ?? 0), 0);
  const clipsGenerated = stageGenerations.reduce((sum, stage) => sum + (stage.clips?.length ?? 0), 0);
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
    generationStatus: project.generation?.status ?? null,
    imagesGenerated,
    clipsGenerated,
  };
}

function serializeProject(project) {
  return decorateProject(project);
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
  await generationManager.recoverInterrupted();
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
    flow: await flowSession.describe(),
    settings: getSettings(store),
  };
}

async function buildPackFiles(project, { assets = null } = {}) {
  const storyboard = project.storyboard;
  const assetFiles = assets ?? (await generationManager.collectAssetFiles(project));
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
    ...buildFlowPackFiles(project, assetFiles),
    ...assetFiles,
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

async function buildExport(project, format) {
  const base = projectExportName(project);
  const assetFiles = await generationManager.collectAssetFiles(project);
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
  if (format === 'flow') {
    return {
      filename: `${base}-flow-pack.zip`,
      contentType: 'application/zip',
      data: createZip([
        ...buildFlowPackFiles(project, assetFiles),
        { name: 'continuity-bible.md', data: buildContinuityMarkdown(project) },
        { name: 'negative-prompt.txt', data: project.storyboard.negativePrompt },
        { name: 'thumbnail-prompt.txt', data: project.storyboard.thumbnailPrompt },
        { name: 'manifest.json', data: buildProjectJson(project) },
        ...assetFiles,
      ]),
    };
  }
  if (format === 'zip') {
    return {
      filename: `${base}-pack.zip`,
      contentType: 'application/zip',
      data: createZip(await buildPackFiles(project, { assets: assetFiles })),
    };
  }
  throw new HttpError(400, 'unsupported_format', 'Format must be md, json, csv, handoff, flow or zip');
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
    generation: null,
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
  await generationManager.resetProjectAssets(id).catch(() => {});
  await transact((store) => {
    const index = store.projects.findIndex((project) => project.id === id);
    if (index < 0) throw new HttpError(404, 'project_not_found', 'Project not found');
    store.projects.splice(index, 1);
  });
  await removeProjectMedia(id);
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

  await generationManager.resetProjectAssets(id).catch(() => {});
  const updated = await transact((transactionStore) => {
    const project = findProject(transactionStore, id);
    project.dish = selection.dish;
    project.analysis = selection.analysis;
    project.title = `${selection.dish.name} · ${getAudience(project.audience).shortLabel}`;
    project.storyboard = null;
    project.generation = null;
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
  await generationManager.resetProjectAssets(id).catch(() => {});
  const project = await transact((store) => {
    const target = findProject(store, id);
    if (!target.dish) throw new HttpError(409, 'dish_missing', 'Select a dish first');
    const requestedSeed = Number(body.variantSeed);
    const variantSeed = Number.isFinite(requestedSeed)
      ? Math.max(0, Math.floor(requestedSeed))
      : target.storyboard?.variantSeed ?? target.rerolls ?? 0;
    target.storyboard = buildStoryboard({ project: target, variantSeed });
    target.generation = null;
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
  const bundle = await buildExport(project, format);
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

async function handleFlowStatus(req, res) {
  sendJson(res, 200, { flow: await flowSession.describe() });
}

async function handleFlowConnect(req, res) {
  const body = await readJson(req);
  const flow = await flowSession.connect({ consent: body.consent === true });
  sendJson(res, 202, { flow });
}

async function handleFlowDisconnect(req, res) {
  const body = await readJson(req);
  const flow = await flowSession.disconnect({ clearProfile: body.clearProfile === true });
  sendJson(res, 200, { flow });
}

async function handleFlowPause(req, res) {
  const body = await readJson(req);
  const flow = await flowSession.pause(
    cleanText(body.reason || 'Paused by you. Resolve anything in the Flow window, then resume.', 500),
  );
  sendJson(res, 200, { flow });
}

async function handleFlowResume(req, res) {
  const flow = await flowSession.resume();
  sendJson(res, 200, { flow });
}

async function handleFlowFocus(req, res) {
  const flow = await flowSession.focus();
  sendJson(res, 200, { flow });
}

async function handleFlowDiagnostics(req, res) {
  const diagnostics = await flowSession.captureDiagnostics();
  sendJson(res, 200, { diagnostics, flow: await flowSession.describe() });
}

async function handleFlowScreenshot(req, res) {
  const file = flowSession.screenshotPath();
  if (!file) throw new HttpError(404, 'screenshot_not_found', 'No Flow screenshot has been captured yet');
  let data;
  try {
    data = await fs.readFile(file);
  } catch {
    throw new HttpError(404, 'screenshot_not_found', 'No Flow screenshot has been captured yet');
  }
  res.writeHead(200, {
    ...baseHeaders('image/png'),
    'Cache-Control': 'no-store',
    'Content-Length': data.length,
  });
  res.end(data);
}

async function writeUploadToTemp(req, tempPath) {
  const declared = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    throw new HttpError(
      413,
      'payload_too_large',
      `Upload is larger than the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB limit`,
    );
  }
  let size = 0;
  const limiter = new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        callback(
          new HttpError(
            413,
            'payload_too_large',
            `Upload is larger than the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB limit`,
          ),
        );
        return;
      }
      callback(null, chunk);
    },
  });
  try {
    await pipeline(req, limiter, createWriteStream(tempPath, { flags: 'wx' }));
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }
  if (size === 0) {
    await fs.unlink(tempPath).catch(() => {});
    throw new HttpError(400, 'empty_upload', 'Upload a non-empty image or video file');
  }
  return size;
}

function stageByOneBasedIndex(project, index) {
  const storyboard = ensureStoryboard(project);
  const stage = storyboard.stages[index];
  if (!stage) {
    throw new HttpError(404, 'stage_not_found', `Stage ${index + 1} does not exist`);
  }
  return stage;
}

async function handleImportAsset(req, res, projectId, stageIndex, url) {
  const kind = String(url.searchParams.get('kind') || '').toLowerCase();
  if (kind !== 'image' && kind !== 'clip') {
    throw new HttpError(400, 'invalid_asset_kind', 'kind must be image or clip');
  }
  const store = await readStore();
  const project = findProject(store, projectId);
  const stage = stageByOneBasedIndex(project, stageIndex);
  const tempPath = await createUploadTempPath(path.extname(url.searchParams.get('filename') || ''));
  await writeUploadToTemp(req, tempPath);
  let updated;
  try {
    updated = await generationManager.importAsset(projectId, stage.id, kind, tempPath, {
      mimeType: String(req.headers['content-type'] || ''),
      approved: url.searchParams.get('approve') === '1' ? true : null,
    });
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }
  sendJson(res, 201, { project: serializeProject(updated) });
}

async function handleGenerate(req, res, projectId, kind) {
  const body = await readJson(req);
  const result = await generationManager.start(projectId, kind, {
    stageIds: Array.isArray(body.stageIds) ? body.stageIds : [],
    autoApprove: body.autoApprove === true,
  });
  sendJson(res, 202, {
    queued: true,
    project: result.project,
    generation: result.project.generation,
  });
}

async function handleGenerationStatus(req, res, projectId) {
  const store = await readStore();
  const project = findProject(store, projectId);
  const serialized = serializeProject(project);
  sendJson(res, 200, {
    generation: serialized.generation ?? null,
    flow: await flowSession.describe(),
  });
}

async function handleCancelGeneration(req, res, projectId) {
  await generationManager.cancel(projectId);
  const store = await readStore();
  const project = findProject(store, projectId);
  sendJson(res, 202, { project: serializeProject(project) });
}

async function handleAssetUpdate(req, res, projectId, stageIndex, assetId) {
  const body = await readJson(req);
  const store = await readStore();
  const project = findProject(store, projectId);
  const stage = stageByOneBasedIndex(project, stageIndex);
  const updated = await generationManager.setAssetApproval(
    projectId,
    stage.id,
    decodeURIComponent(assetId),
    body.approved !== false,
  );
  sendJson(res, 200, { project: serializeProject(updated) });
}

async function handleAssetDelete(req, res, projectId, stageIndex, assetId) {
  const store = await readStore();
  const project = findProject(store, projectId);
  const stage = stageByOneBasedIndex(project, stageIndex);
  const updated = await generationManager.deleteAsset(projectId, stage.id, decodeURIComponent(assetId));
  sendJson(res, 200, { project: serializeProject(updated) });
}

async function handleApproveImages(req, res, projectId) {
  const body = await readJson(req);
  const updated = await generationManager.approveLatestImages(projectId, {
    stageIds: Array.isArray(body.stageIds) ? body.stageIds : [],
    approved: body.approved !== false,
  });
  sendJson(res, 200, { project: serializeProject(updated) });
}

async function handleMedia(req, res, projectId, stageId, filename, url) {
  const store = await readStore();
  const project = findProject(store, projectId);
  const stage = ensureStoryboard(project).stages.find(
    (item) => item.id.toLowerCase() === String(stageId).toLowerCase(),
  );
  if (!stage) throw new HttpError(404, 'stage_not_found', 'Stage not found');
  const stageGeneration = project.generation?.stages?.[stage.id];
  const asset = [...(stageGeneration?.images ?? []), ...(stageGeneration?.clips ?? [])].find(
    (item) => item.file === filename,
  );
  if (!asset || !isAllowedMediaFile(filename)) {
    throw new HttpError(404, 'asset_not_found', 'Media asset not found');
  }

  const filePath = assetFilePath(projectId, stage.id, filename);
  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    throw new HttpError(404, 'asset_file_missing', 'Media file is missing from local storage');
  }
  if (!stat.isFile()) throw new HttpError(404, 'asset_file_missing', 'Media file is missing');

  const contentType = mediaContentType(filename);
  const download = url.searchParams.get('download') === '1';
  const headers = {
    ...baseHeaders(contentType),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=31536000, immutable',
  };
  if (download) {
    const extension = path.extname(filename);
    headers['Content-Disposition'] = `attachment; filename="${stage.id}-${asset.kind}${extension}"`;
  }

  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
    if (!match) {
      res.writeHead(416, {
        ...baseHeaders(contentType),
        'Content-Range': `bytes */${stat.size}`,
      });
      res.end();
      return;
    }
    let start = match[1] === '' ? null : Number(match[1]);
    let end = match[2] === '' ? null : Number(match[2]);
    if (start === null) {
      const suffix = end ?? 0;
      start = Math.max(0, stat.size - suffix);
      end = stat.size - 1;
    } else {
      end = end === null ? stat.size - 1 : Math.min(end, stat.size - 1);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
      res.writeHead(416, {
        ...baseHeaders(contentType),
        'Content-Range': `bytes */${stat.size}`,
      });
      res.end();
      return;
    }
    res.writeHead(206, {
      ...headers,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': end - start + 1,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    await pipeline(createReadStream(filePath, { start, end }), res).catch(() => {});
    return;
  }

  res.writeHead(200, {
    ...headers,
    'Content-Length': stat.size,
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  await pipeline(createReadStream(filePath), res).catch(() => {});
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
      flowMode: flowSession.mode,
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

  if (pathname === '/api/flow/status' && method === 'GET') {
    await handleFlowStatus(req, res);
    return;
  }

  if (pathname === '/api/flow/connect' && method === 'POST') {
    await handleFlowConnect(req, res);
    return;
  }

  if (pathname === '/api/flow/disconnect' && method === 'POST') {
    await handleFlowDisconnect(req, res);
    return;
  }

  if (pathname === '/api/flow/pause' && method === 'POST') {
    await handleFlowPause(req, res);
    return;
  }

  if (pathname === '/api/flow/resume' && method === 'POST') {
    await handleFlowResume(req, res);
    return;
  }

  if (pathname === '/api/flow/focus' && method === 'POST') {
    await handleFlowFocus(req, res);
    return;
  }

  if (pathname === '/api/flow/diagnostics' && method === 'POST') {
    await handleFlowDiagnostics(req, res);
    return;
  }

  if (pathname === '/api/flow/screenshot' && (method === 'GET' || method === 'HEAD')) {
    await handleFlowScreenshot(req, res);
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

  const generateMatch = pathname.match(/^\/api\/projects\/([^/]+)\/generate\/(images|clips)$/);
  if (generateMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleGenerate(
      req,
      res,
      decodeURIComponent(generateMatch[1]),
      generateMatch[2],
    );
    return;
  }

  const cancelGenerationMatch = pathname.match(/^\/api\/projects\/([^/]+)\/generate\/cancel$/);
  if (cancelGenerationMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleCancelGeneration(req, res, decodeURIComponent(cancelGenerationMatch[1]));
    return;
  }

  const generationMatch = pathname.match(/^\/api\/projects\/([^/]+)\/generation$/);
  if (generationMatch) {
    if (method !== 'GET') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleGenerationStatus(req, res, decodeURIComponent(generationMatch[1]));
    return;
  }

  const approveImagesMatch = pathname.match(/^\/api\/projects\/([^/]+)\/approve-images$/);
  if (approveImagesMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleApproveImages(req, res, decodeURIComponent(approveImagesMatch[1]));
    return;
  }

  const importAssetMatch = pathname.match(/^\/api\/projects\/([^/]+)\/stages\/(\d+)\/assets$/);
  if (importAssetMatch) {
    if (method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    await handleImportAsset(
      req,
      res,
      decodeURIComponent(importAssetMatch[1]),
      Number(importAssetMatch[2]) - 1,
      url,
    );
    return;
  }

  const assetMatch = pathname.match(
    /^\/api\/projects\/([^/]+)\/stages\/(\d+)\/assets\/([^/]+)$/,
  );
  if (assetMatch) {
    const projectId = decodeURIComponent(assetMatch[1]);
    const stageIndex = Number(assetMatch[2]) - 1;
    const assetId = assetMatch[3];
    if (method === 'PATCH') {
      await handleAssetUpdate(req, res, projectId, stageIndex, assetId);
      return;
    }
    if (method === 'DELETE') {
      await handleAssetDelete(req, res, projectId, stageIndex, assetId);
      return;
    }
    throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
  }

  const mediaMatch = pathname.match(/^\/api\/projects\/([^/]+)\/media\/([^/]+)\/([^/]+)$/);
  if (mediaMatch) {
    if (method !== 'GET' && method !== 'HEAD') {
      throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
    }
    await handleMedia(
      req,
      res,
      decodeURIComponent(mediaMatch[1]),
      decodeURIComponent(mediaMatch[2]),
      decodeURIComponent(mediaMatch[3]),
      url,
    );
    return;
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
    // Expected client/domain errors (4xx) are part of normal operation; only
    // log unexpected failures so the console stays useful.
    const statusCode = Number(error?.statusCode) || 500;
    if (statusCode >= 500) {
      console.error('[VidMo]', error);
    }
    sendError(res, error);
  }
}
