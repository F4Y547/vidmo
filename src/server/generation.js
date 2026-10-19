import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { readStore, transact } from './store.js';
import { flowSession } from './flow/session.js';
import { FlowBusyError } from './flow/errors.js';
import { generateImage, generateVideo } from './flow/automation.js';
import { stubGenerateClip, stubGenerateImage } from './flow/stub.js';
import {
  assetFilePath,
  deleteAssetFile,
  ingestMediaFile,
  isAllowedMediaFile,
  readAssetBuffer,
  removeProjectMedia,
  saveMediaBuffer,
} from './media.js';

const ACTIVE_STATUSES = new Set(['queued', 'running', 'attention', 'cancelling']);
const TERMINAL_STATUSES = new Set(['complete', 'partial', 'error', 'cancelled', 'interrupted']);

export class GenerationError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'GenerationError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export function hashStagePrompt(stage, kind) {
  const prompt = kind === 'clip' ? stage?.motionPrompt : stage?.imagePrompt;
  return crypto.createHash('sha256').update(String(prompt ?? '')).digest('hex').slice(0, 20);
}

function newAssetId(kind) {
  return `${kind === 'clip' ? 'clip' : 'img'}_${crypto.randomBytes(5).toString('hex')}`;
}

export function ensureGeneration(project) {
  if (!project.generation || typeof project.generation !== 'object') {
    project.generation = {
      status: 'idle',
      kind: null,
      message: 'No Flow media generated yet.',
      stages: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }
  if (!project.generation.stages || typeof project.generation.stages !== 'object') {
    project.generation.stages = {};
  }
  return project.generation;
}

export function ensureStageGeneration(project, stageId) {
  const generation = ensureGeneration(project);
  if (!generation.stages[stageId]) {
    generation.stages[stageId] = {
      images: [],
      clips: [],
      approvedImageId: null,
      approvedClipId: null,
      status: 'idle',
      error: null,
    };
  }
  const stageGeneration = generation.stages[stageId];
  stageGeneration.images = Array.isArray(stageGeneration.images) ? stageGeneration.images : [];
  stageGeneration.clips = Array.isArray(stageGeneration.clips) ? stageGeneration.clips : [];
  return stageGeneration;
}

export function decorateProject(project) {
  const clone = structuredClone(project);
  const generation = clone.generation;
  if (!generation || !clone.storyboard) return clone;
  const stages = clone.storyboard.stages ?? [];
  for (const stage of stages) {
    const stageGeneration = generation.stages?.[stage.id];
    if (!stageGeneration) continue;
    const imageHash = hashStagePrompt(stage, 'image');
    const clipHash = hashStagePrompt(stage, 'clip');
    for (const asset of [...(stageGeneration.images ?? []), ...(stageGeneration.clips ?? [])]) {
      const expected = asset.kind === 'clip' ? clipHash : imageHash;
      asset.promptStale = Boolean(asset.promptHash && asset.promptHash !== expected);
    }
    stageGeneration.latestImageId = stageGeneration.images?.at(-1)?.id ?? null;
    stageGeneration.latestClipId = stageGeneration.clips?.at(-1)?.id ?? null;
    stageGeneration.imageCount = stageGeneration.images?.length ?? 0;
    stageGeneration.clipCount = stageGeneration.clips?.length ?? 0;
  }
  const allStages = Object.values(generation.stages);
  generation.summary = {
    images: allStages.reduce((sum, stage) => sum + (stage.images?.length ?? 0), 0),
    clips: allStages.reduce((sum, stage) => sum + (stage.clips?.length ?? 0), 0),
    approvedImages: allStages.filter((stage) => stage.approvedImageId).length,
    approvedClips: allStages.filter((stage) => stage.approvedClipId).length,
    stagesWithImages: allStages.filter((stage) => (stage.images?.length ?? 0) > 0).length,
    stagesWithClips: allStages.filter((stage) => (stage.clips?.length ?? 0) > 0).length,
  };
  return clone;
}

function findProjectOrThrow(store, projectId) {
  const project = store.projects.find((item) => item.id === projectId);
  if (!project) {
    throw new GenerationError(404, 'project_not_found', 'Project not found');
  }
  return project;
}

function stageList(project) {
  if (!project.storyboard) {
    throw new GenerationError(409, 'storyboard_missing', 'Generate the storyboard before using Flow');
  }
  return project.storyboard.stages ?? [];
}

function normalizeStageIds(project, requested) {
  const stages = stageList(project);
  if (!Array.isArray(requested) || requested.length === 0) return stages.map((stage) => stage.id);
  const byId = new Map();
  for (const [index, stage] of stages.entries()) {
    byId.set(stage.id.toLowerCase(), stage.id);
    byId.set(String(index + 1), stage.id);
    byId.set(`stage-${index + 1}`, stage.id);
  }
  const result = [];
  for (const item of requested) {
    const key = String(item).trim().toLowerCase();
    const id = byId.get(key);
    if (!id) {
      throw new GenerationError(400, 'stage_not_found', `Stage "${item}" does not exist`);
    }
    if (!result.includes(id)) result.push(id);
  }
  return result;
}

function approvedImageFor(project, stageId) {
  const stage = project.storyboard.stages.find((item) => item.id === stageId);
  if (!stage) return null;
  const stageGeneration = project.generation?.stages?.[stageId];
  if (!stageGeneration) return null;
  const approved =
    stageGeneration.images?.find((asset) => asset.id === stageGeneration.approvedImageId) ??
    stageGeneration.images?.find((asset) => asset.approved);
  if (!approved) return null;
  return { stage, stageGeneration, asset: approved };
}

function imagePath(projectId, stageId, asset) {
  return asset.file ? assetFilePath(projectId, stageId, asset.file) : null;
}

class GenerationManager {
  constructor() {
    this.queue = Promise.resolve();
    this.active = new Map();
    this.messageState = new Map();
    this.recovered = false;
  }

  async recoverInterrupted() {
    if (this.recovered) return;
    this.recovered = true;
    await transact((store) => {
      let changed = false;
      for (const project of store.projects) {
        const generation = project.generation;
        if (!generation || !ACTIVE_STATUSES.has(generation.status)) continue;
        generation.status = 'interrupted';
        generation.message =
          'The VidMo server restarted while this Flow job was running. Review the assets, then reroll the missing shots.';
        generation.finishedAt = nowIso();
        generation.updatedAt = nowIso();
        generation.currentStageId = null;
        for (const stageGeneration of Object.values(generation.stages ?? {})) {
          if (stageGeneration.status === 'running' || stageGeneration.status === 'queued') {
            stageGeneration.status = 'interrupted';
          }
        }
        changed = true;
      }
      return changed;
    });
  }

  enqueue(task) {
    const run = this.queue.then(task);
    this.queue = run.catch(() => {});
    return run;
  }

  isBusy(projectId) {
    return this.active.has(projectId);
  }

  async flowPreflight() {
    if (flowSession.mode === 'stub') return;
    const flow = await flowSession.describe();
    if (!flow.configured) {
      throw new GenerationError(
        503,
        'flow_unavailable',
        flow.installNote ||
          'Google Flow automation is unavailable. Install the optional playwright-core package or use the Flow pack.',
      );
    }
    if (!flow.connected) {
      throw new GenerationError(
        409,
        'flow_not_connected',
        'Connect Google Flow in the Flow panel before generating media.',
      );
    }
    if (flow.status === 'attention') {
      throw new GenerationError(
        409,
        'flow_needs_attention',
        flow.attention || 'Google Flow needs your attention before it can generate.',
      );
    }
  }

  async start(projectId, kind, { stageIds: requestedStageIds, autoApprove = false } = {}) {
    if (!['images', 'clips'].includes(kind)) {
      throw new GenerationError(400, 'invalid_generation_kind', 'Generation kind must be images or clips');
    }
    if (this.active.has(projectId)) {
      throw new FlowBusyError('This project already has a Flow job running. Wait for it to finish or cancel it.');
    }
    await this.flowPreflight();
    const store = await readStore();
    const project = findProjectOrThrow(store, projectId);
    const stageIds = normalizeStageIds(project, requestedStageIds);

    if (kind === 'clips') {
      const missing = [];
      for (const stageId of stageIds) {
        if (!approvedImageFor(project, stageId)) missing.push(stageId);
      }
      if (missing.length) {
        throw new GenerationError(
          409,
          'approved_image_required',
          `Approve a stage image before generating clips. Missing: ${missing.join(', ')}`,
          { missing },
        );
      }
    }

    const startedAt = nowIso();
    const updated = await transact((transactionStore) => {
      const target = findProjectOrThrow(transactionStore, projectId);
      const generation = ensureGeneration(target);
      generation.status = 'queued';
      generation.kind = kind;
      generation.stageIds = stageIds;
      generation.total = stageIds.length;
      generation.completed = 0;
      generation.failed = 0;
      generation.currentStageId = null;
      generation.message = 'Queued. Flow handles one generation at a time.';
      generation.startedAt = startedAt;
      generation.updatedAt = startedAt;
      generation.finishedAt = null;
      generation.autoApprove = Boolean(autoApprove);
      generation.errors = [];
      generation.lastError = null;
      for (const stageId of stageIds) {
        const stageGeneration = ensureStageGeneration(target, stageId);
        stageGeneration.status = 'queued';
        stageGeneration.error = null;
      }
      target.updatedAt = startedAt;
      return target;
    });

    const controller = new AbortController();
    const active = {
      controller,
      kind,
      promise: null,
      startedAt,
    };
    this.active.set(projectId, active);
    const task = this.enqueue(() =>
      this.execute(projectId, kind, { stageIds, autoApprove, signal: controller.signal }),
    );
    active.promise = task;
    task
      .catch((error) => {
        console.error('[VidMo Flow]', error);
      })
      .finally(() => {
        this.active.delete(projectId);
        this.messageState.delete(projectId);
      });

    return { queued: true, project: decorated(updated) };
  }

  progress(projectId, message, stageId = null) {
    const now = Date.now();
    const previous = this.messageState.get(projectId);
    if (previous && now - previous.at < 900 && previous.message === message) return;
    this.messageState.set(projectId, { at: now, message });
    transact((store) => {
      const project = store.projects.find((item) => item.id === projectId);
      if (!project?.generation || !ACTIVE_STATUSES.has(project.generation.status)) return;
      project.generation.message = String(message).slice(0, 500);
      project.generation.currentStageId = stageId;
      project.generation.updatedAt = nowIso();
      project.updatedAt = nowIso();
    }).catch(() => {});
  }

  async execute(projectId, kind, { stageIds, autoApprove, signal }) {
    let completed = 0;
    let failed = 0;
    let cancelled = false;
    const errors = [];

    await transact((store) => {
      const project = findProjectOrThrow(store, projectId);
      const generation = ensureGeneration(project);
      generation.status = 'running';
      generation.message = 'Opening Google Flow…';
      generation.updatedAt = nowIso();
      project.updatedAt = nowIso();
    });

    try {
      for (const stageId of stageIds) {
        if (signal.aborted) {
          cancelled = true;
          break;
        }
        const snapshot = await readStore();
        const project = findProjectOrThrow(snapshot, projectId);
        const stage = project.storyboard?.stages?.find((item) => item.id === stageId);
        if (!stage) {
          failed += 1;
          errors.push({ stageId, message: 'Stage no longer exists' });
          continue;
        }
        const stageNumber = project.storyboard.stages.indexOf(stage) + 1;
        const label = `Stage ${stageNumber} · ${stage.name}`;
        this.progress(projectId, `${label}: starting Flow…`, stageId);

        await transact((store) => {
          const target = findProjectOrThrow(store, projectId);
          const generation = ensureGeneration(target);
          generation.currentStageId = stageId;
          generation.message = `${label}: starting Flow…`;
          generation.updatedAt = nowIso();
          const stageGeneration = ensureStageGeneration(target, stageId);
          stageGeneration.status = 'running';
          stageGeneration.error = null;
          target.updatedAt = nowIso();
        });

        try {
          let result;
          if (kind === 'images') {
            result =
              flowSession.mode === 'stub'
                ? await stubGenerateImage({
                    prompt: stage.imagePrompt,
                    stageLabel: label,
                    onProgress: (message) => this.progress(projectId, message, stageId),
                  })
                : await generateImage({
                    session: flowSession,
                    prompt: stage.imagePrompt,
                    projectId,
                    projectTitle: project.title,
                    stageLabel: label,
                    signal,
                    onProgress: (message) => this.progress(projectId, message, stageId),
                  });
          } else {
            const approved = approvedImageFor(project, stageId);
            if (!approved) {
              throw new GenerationError(
                409,
                'approved_image_required',
                `${label}: approve a stage image before generating its clip.`,
              );
            }
            const startImagePath = imagePath(projectId, stageId, approved.asset);
            try {
              await fs.access(startImagePath);
            } catch {
              throw new GenerationError(
                409,
                'approved_image_missing',
                `${label}: the approved image file is missing. Import it again or approve another image.`,
              );
            }
            result =
              flowSession.mode === 'stub'
                ? await stubGenerateClip({
                    prompt: stage.motionPrompt,
                    stageLabel: label,
                    onProgress: (message) => this.progress(projectId, message, stageId),
                  })
                : await generateVideo({
                    session: flowSession,
                    prompt: stage.motionPrompt,
                    startImagePath,
                    projectId,
                    projectTitle: project.title,
                    stageLabel: label,
                    signal,
                    onProgress: (message) => this.progress(projectId, message, stageId),
                  });
          }

          const assetId = newAssetId(kind === 'images' ? 'image' : 'clip');
          const saved = await saveMediaBuffer({
            projectId,
            stageId,
            assetId,
            buffer: result.buffer,
            mimeType: result.mimeType,
            kind: kind === 'images' ? 'image' : 'clip',
          });
          const asset = {
            id: assetId,
            kind: kind === 'images' ? 'image' : 'clip',
            ...saved,
            duration: kind === 'clips' ? stage.duration : undefined,
            promptHash:
              kind === 'images' ? hashStagePrompt(stage, 'image') : hashStagePrompt(stage, 'clip'),
            promptLength: result.promptLength ?? null,
            model: result.modelLabel || result.model || (flowSession.mode === 'stub' ? 'VidMo Flow Simulator' : 'Google Flow'),
            source: flowSession.mode === 'stub' ? 'simulator' : 'flow',
            stub: Boolean(result.stub),
            warnings: result.warnings ?? [],
            aspectApplied: result.aspectApplied ?? null,
            createdAt: nowIso(),
          };

          const updated = await transact((store) => {
            const target = findProjectOrThrow(store, projectId);
            const generation = ensureGeneration(target);
            const stageGeneration = ensureStageGeneration(target, stageId);
            if (kind === 'images') {
              stageGeneration.images.push(asset);
              if (autoApprove) {
                for (const image of stageGeneration.images) image.approved = false;
                asset.approved = true;
                stageGeneration.approvedImageId = asset.id;
              }
            } else {
              stageGeneration.clips.push(asset);
              for (const clip of stageGeneration.clips) clip.approved = false;
              asset.approved = true;
              stageGeneration.approvedClipId = asset.id;
            }
            stageGeneration.status = 'complete';
            stageGeneration.lastGeneratedAt = nowIso();
            stageGeneration.error = null;
            generation.completed = (generation.completed ?? 0) + 1;
            generation.currentStageId = stageId;
            generation.status = 'running';
            generation.message =
              kind === 'images'
                ? `${label}: image saved (${generation.completed}/${generation.total}).`
                : `${label}: clip saved (${generation.completed}/${generation.total}).`;
            generation.updatedAt = nowIso();
            target.updatedAt = nowIso();
            return target;
          });
          completed = updated.generation.completed;
          this.progress(projectId, updated.generation.message, stageId);
        } catch (error) {
          if (error.name === 'AbortError' || error.code === 'generation_cancelled' || signal.aborted) {
            cancelled = true;
            await this.markStageFailed(projectId, stageId, 'cancelled', 'Generation cancelled', errors);
            break;
          }
          failed += 1;
          errors.push({ stageId, message: error.message, code: error.code ?? null });
          await this.markStageFailed(projectId, stageId, 'error', error.message, errors);
          const stopCodes = new Set([
            'flow_not_connected',
            'flow_disconnected',
            'flow_needs_attention',
            'flow_unavailable',
            'flow_busy',
          ]);
          if (stopCodes.has(error.code)) break;
        }
      }
    } catch (error) {
      await this.finish(projectId, {
        status: 'error',
        completed,
        failed: failed + 1,
        cancelled,
        errors: [...errors, { message: error.message, code: error.code ?? null }],
        message: `Flow generation stopped: ${error.message}`,
      });
      return;
    }

    const status = cancelled
      ? 'cancelled'
      : failed === 0
        ? 'complete'
        : completed > 0
          ? 'partial'
          : 'error';
    let message;
    if (cancelled) message = 'Generation cancelled. Completed media is safe.';
    else if (status === 'complete') {
      message =
        kind === 'images'
          ? `${completed} stage image${completed === 1 ? '' : 's'} generated in Google Flow.`
          : `${completed} stage clip${completed === 1 ? '' : 's'} generated in Google Flow.`;
    } else if (status === 'partial') {
      message = `${completed} generated, ${failed} failed. Open the flagged stages to retry.`;
    } else {
      message = errors[0]?.message
        ? `Generation failed: ${errors[0].message}`
        : 'Flow generation failed.';
    }
    await this.finish(projectId, { status, completed, failed, cancelled, errors, message });
  }

  async markStageFailed(projectId, stageId, status, message, errors) {
    await transact((store) => {
      const project = store.projects.find((item) => item.id === projectId);
      if (!project) return;
      const generation = ensureGeneration(project);
      const stageGeneration = ensureStageGeneration(project, stageId);
      stageGeneration.status = status;
      stageGeneration.error = {
        message: String(message).slice(0, 1000),
        at: nowIso(),
      };
      generation.failed = errors.filter((item) => item.stageId).length;
      generation.status = 'running';
      generation.message = message;
      generation.errors = errors;
      generation.updatedAt = nowIso();
      project.updatedAt = nowIso();
    });
  }

  async finish(projectId, { status, completed, failed, cancelled, errors, message }) {
    await transact((store) => {
      const project = store.projects.find((item) => item.id === projectId);
      if (!project) return;
      const generation = ensureGeneration(project);
      generation.status = status;
      generation.completed = completed;
      generation.failed = failed;
      generation.cancelled = Boolean(cancelled);
      generation.errors = errors;
      generation.lastError = errors?.[0]?.message ?? null;
      generation.message = String(message).slice(0, 1000);
      generation.currentStageId = null;
      generation.finishedAt = nowIso();
      generation.updatedAt = nowIso();
      for (const stageGeneration of Object.values(generation.stages ?? {})) {
        if (stageGeneration.status === 'queued') stageGeneration.status = 'skipped';
        if (stageGeneration.status === 'running' && status !== 'complete') {
          stageGeneration.status = 'error';
        }
      }
      project.updatedAt = nowIso();
    });
  }

  async cancel(projectId) {
    const active = this.active.get(projectId);
    if (!active) {
      const store = await readStore();
      const project = findProjectOrThrow(store, projectId);
      const generation = project.generation;
      if (!generation || !ACTIVE_STATUSES.has(generation.status)) {
        throw new GenerationError(409, 'no_active_generation', 'No Flow generation is running for this project');
      }
      await transact((transactionStore) => {
        const target = findProjectOrThrow(transactionStore, projectId);
        target.generation.status = 'cancelled';
        target.generation.message = 'Generation cancelled before it started.';
        target.generation.finishedAt = nowIso();
        target.generation.updatedAt = nowIso();
      });
      return;
    }
    active.controller.abort();
    await transact((store) => {
      const project = store.projects.find((item) => item.id === projectId);
      if (!project?.generation) return;
      project.generation.status = 'cancelling';
      project.generation.message = 'Cancelling after the current Flow step…';
      project.generation.updatedAt = nowIso();
    });
    return { cancelling: true };
  }

  async setAssetApproval(projectId, stageId, assetId, approved = true) {
    const updated = await transact((store) => {
      const project = findProjectOrThrow(store, projectId);
      stageList(project);
      const stageGeneration = ensureStageGeneration(project, stageId);
      const asset =
        stageGeneration.images.find((item) => item.id === assetId) ??
        stageGeneration.clips.find((item) => item.id === assetId);
      if (!asset) throw new GenerationError(404, 'asset_not_found', 'Asset not found');
      if (asset.kind === 'image') {
        for (const image of stageGeneration.images) image.approved = false;
        asset.approved = Boolean(approved);
        stageGeneration.approvedImageId = approved ? asset.id : null;
      } else {
        for (const clip of stageGeneration.clips) clip.approved = false;
        asset.approved = Boolean(approved);
        stageGeneration.approvedClipId = approved ? asset.id : null;
      }
      project.updatedAt = nowIso();
      return project;
    });
    return decorated(updated);
  }

  async approveLatestImages(projectId, { stageIds: requested, approved = true } = {}) {
    const updated = await transact((store) => {
      const project = findProjectOrThrow(store, projectId);
      const stageIds = normalizeStageIds(project, requested);
      for (const stageId of stageIds) {
        const stageGeneration = ensureStageGeneration(project, stageId);
        const latest = stageGeneration.images.at(-1);
        if (!latest) continue;
        for (const image of stageGeneration.images) image.approved = false;
        latest.approved = Boolean(approved);
        stageGeneration.approvedImageId = approved ? latest.id : null;
      }
      project.updatedAt = nowIso();
      return project;
    });
    return decorated(updated);
  }

  async deleteAsset(projectId, stageId, assetId) {
    let fileToDelete = null;
    const updated = await transact((store) => {
      const project = findProjectOrThrow(store, projectId);
      const stageGeneration = ensureStageGeneration(project, stageId);
      const collection = stageGeneration.images.some((item) => item.id === assetId)
        ? stageGeneration.images
        : stageGeneration.clips;
      const index = collection.findIndex((item) => item.id === assetId);
      if (index < 0) throw new GenerationError(404, 'asset_not_found', 'Asset not found');
      const [asset] = collection.splice(index, 1);
      fileToDelete = asset.file;
      if (stageGeneration.approvedImageId === assetId) stageGeneration.approvedImageId = null;
      if (stageGeneration.approvedClipId === assetId) stageGeneration.approvedClipId = null;
      project.updatedAt = nowIso();
      return project;
    });
    if (fileToDelete) await deleteAssetFile(projectId, stageId, fileToDelete);
    return decorated(updated);
  }

  async importAsset(projectId, stageId, kind, tempPath, { mimeType = '', approved = null } = {}) {
    if (kind !== 'image' && kind !== 'clip') {
      throw new GenerationError(400, 'invalid_asset_kind', 'Asset kind must be image or clip');
    }
    const store = await readStore();
    const project = findProjectOrThrow(store, projectId);
    const stage = stageList(project).find((item) => item.id === stageId);
    if (!stage) throw new GenerationError(404, 'stage_not_found', 'Stage not found');
    const assetId = newAssetId(kind);
    let saved;
    try {
      saved = await ingestMediaFile({
        projectId,
        stageId,
        assetId,
        tempPath,
        mimeType,
        kind,
      });
    } catch (error) {
      await fs.unlink(tempPath).catch(() => {});
      throw error;
    }
    const asset = {
      id: assetId,
      kind,
      ...saved,
      duration: kind === 'clip' ? stage.duration : undefined,
      promptHash: hashStagePrompt(stage, kind === 'clip' ? 'clip' : 'image'),
      model: 'Imported media',
      source: 'upload',
      stub: false,
      warnings: [],
      createdAt: nowIso(),
    };
    const shouldApprove = approved === null ? kind === 'clip' : Boolean(approved);
    const updated = await transact((transactionStore) => {
      const target = findProjectOrThrow(transactionStore, projectId);
      const stageGeneration = ensureStageGeneration(target, stageId);
      if (kind === 'image') {
        stageGeneration.images.push(asset);
        if (shouldApprove) {
          for (const image of stageGeneration.images) image.approved = false;
          asset.approved = true;
          stageGeneration.approvedImageId = asset.id;
        }
      } else {
        stageGeneration.clips.push(asset);
        if (shouldApprove) {
          for (const clip of stageGeneration.clips) clip.approved = false;
          asset.approved = true;
          stageGeneration.approvedClipId = asset.id;
        }
      }
      stageGeneration.status = 'complete';
      target.updatedAt = nowIso();
      return target;
    });
    return decorated(updated);
  }

  async resetProjectAssets(projectId, { abort = true } = {}) {
    if (abort) {
      const active = this.active.get(projectId);
      if (active) {
        active.controller.abort();
        await active.promise.catch(() => {});
      }
    }
    await transact((store) => {
      const project = store.projects.find((item) => item.id === projectId);
      if (!project) return;
      project.generation = null;
      project.updatedAt = nowIso();
    });
    await removeProjectMedia(projectId);
  }

  async collectAssetFiles(project, { approvedOnly = false } = {}) {
    const files = [];
    if (!project.generation?.stages || !project.storyboard) return files;
    for (const stage of project.storyboard.stages) {
      const stageGeneration = project.generation.stages[stage.id];
      if (!stageGeneration) continue;
      for (const asset of stageGeneration.images ?? []) {
        if (approvedOnly && !asset.approved) continue;
        if (!asset.file || !isAllowedMediaFile(asset.file)) continue;
        try {
          const data = await readAssetBuffer(project.id, stage.id, asset.file);
          const extension = path.extname(asset.file);
          files.push({
            name: `assets/${stage.id}-image-${asset.id}${extension}`,
            data,
            stageId: stage.id,
            kind: 'image',
            asset,
            downloadName: `${stage.id}-image${extension}`,
          });
        } catch {
          /* ignore missing media files in exports */
        }
      }
      for (const asset of stageGeneration.clips ?? []) {
        if (approvedOnly && !asset.approved) continue;
        if (!asset.file || !isAllowedMediaFile(asset.file)) continue;
        try {
          const data = await readAssetBuffer(project.id, stage.id, asset.file);
          const extension = path.extname(asset.file);
          files.push({
            name: `assets/${stage.id}-clip-${asset.id}${extension}`,
            data,
            stageId: stage.id,
            kind: 'clip',
            asset,
            downloadName: `${stage.id}-clip${extension}`,
          });
        } catch {
          /* ignore missing media files in exports */
        }
      }
    }
    return files;
  }
}

function decorated(project) {
  return decorateProject(project);
}

export const generationManager = new GenerationManager();
export { ACTIVE_STATUSES, TERMINAL_STATUSES };
