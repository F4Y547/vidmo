import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

process.env.VIDMO_DATA_DIR = path.join(os.tmpdir(), `vidmo-flow-test-${process.pid}-${Date.now()}`);
process.env.VIDMO_FLOW_MODE = 'stub';
process.env.VIDMO_FLOW_STUB_SIZE = '96x160';
process.env.VIDMO_FLOW_STUB_DELAY_MS = '0';
process.env.VIDMO_FLOW_STUB_CLIP_DELAY_MS = '0';
delete process.env.VIDMO_RENDER_WEBHOOK;

const { handleRequest } = await import('../src/server/app.js');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(handleRequest);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function request(base, pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    ...options,
    headers: {
      ...(options.body && typeof options.body === 'string'
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers ?? {}),
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  let body;
  if (contentType.includes('application/json')) body = await response.json();
  else body = await response.text();
  return { response, body };
}

async function waitForGeneration(base, projectId, timeoutMs = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = await request(base, `/api/projects/${projectId}/generation`);
    const status = state.body.generation?.status;
    if (['complete', 'partial', 'error', 'cancelled', 'interrupted'].includes(status)) {
      return state.body.generation;
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error('Timed out waiting for stub generation');
}

test('Flow stub pipeline: images → approval → clips → media → Flow pack', async (t) => {
  const { server, base } = await startServer();
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(process.env.VIDMO_DATA_DIR, { recursive: true, force: true }).catch(() => {});
  });

  const bootstrap = await request(base, '/api/bootstrap');
  assert.equal(bootstrap.response.status, 200);
  assert.equal(bootstrap.body.flow.mode, 'stub');
  assert.equal(bootstrap.body.flow.status, 'ready');

  const created = await request(base, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ audience: 'western' }),
  });
  const projectId = created.body.project.id;
  await request(base, `/api/projects/${projectId}/select`, {
    method: 'POST',
    body: JSON.stringify({ dishId: 'cheeseburger' }),
  });
  const storyboard = await request(base, `/api/projects/${projectId}/storyboard`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(storyboard.body.project.storyboard.totalStages, 7);

  const generated = await request(base, `/api/projects/${projectId}/generate/images`, {
    method: 'POST',
    body: JSON.stringify({ stageIds: ['S01', 'S02'], autoApprove: true }),
  });
  assert.equal(generated.response.status, 202);
  assert.equal(generated.body.queued, true);

  const imageGeneration = await waitForGeneration(base, projectId);
  assert.equal(imageGeneration.status, 'complete', imageGeneration.message);
  assert.equal(imageGeneration.completed, 2);
  assert.equal(imageGeneration.stages.S01.images.length, 1);
  assert.equal(imageGeneration.stages.S01.approvedImageId, imageGeneration.stages.S01.images[0].id);
  const image = imageGeneration.stages.S01.images[0];
  assert.equal(image.source, 'simulator');
  assert.ok(image.bytes > 100);

  const media = await fetch(`${base}/api/projects/${projectId}/media/S01/${image.file}`);
  assert.equal(media.status, 200);
  assert.match(media.headers.get('content-type') ?? '', /image\/png/);
  const mediaBuffer = Buffer.from(await media.arrayBuffer());
  assert.deepEqual([...mediaBuffer.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const range = await fetch(`${base}/api/projects/${projectId}/media/S01/${image.file}`, {
    headers: { Range: 'bytes=0-7' },
  });
  assert.equal(range.status, 206);
  assert.equal((await range.arrayBuffer()).byteLength, 8);

  const clips = await request(base, `/api/projects/${projectId}/generate/clips`, {
    method: 'POST',
    body: JSON.stringify({ stageIds: ['S01'] }),
  });
  assert.equal(clips.response.status, 202);
  const clipGeneration = await waitForGeneration(base, projectId);
  assert.equal(clipGeneration.status, 'complete', clipGeneration.message);
  assert.equal(clipGeneration.stages.S01.clips.length, 1);
  const clip = clipGeneration.stages.S01.clips[0];
  assert.equal(clip.source, 'simulator');
  const clipResponse = await fetch(`${base}/api/projects/${projectId}/media/S01/${clip.file}`);
  assert.equal(clipResponse.status, 200);
  assert.match(clipResponse.headers.get('content-type') ?? '', /video\/mp4/);

  const flowPack = await fetch(`${base}/api/projects/${projectId}/export?format=flow`);
  assert.equal(flowPack.status, 200);
  const flowZip = Buffer.from(await flowPack.arrayBuffer());
  assert.equal(flowZip.readUInt32LE(0), 0x04034b50);
  const zipText = flowZip.toString('latin1');
  assert.ok(zipText.includes('flow/board.html'));
  assert.ok(zipText.includes('flow/README.md'));
  assert.ok(zipText.includes('assets/S01-image-'));

  const deletion = await request(
    base,
    `/api/projects/${projectId}/stages/2/assets/${imageGeneration.stages.S02.images[0].id}`,
    { method: 'DELETE' },
  );
  assert.equal(deletion.response.status, 200);
  assert.equal(deletion.body.project.generation.stages.S02.images.length, 0);
});

test('Flow stub requires an approved image before a clip', async (t) => {
  const { server, base } = await startServer();
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(process.env.VIDMO_DATA_DIR, { recursive: true, force: true }).catch(() => {});
  });

  const created = await request(base, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ audience: 'desi' }),
  });
  const projectId = created.body.project.id;
  await request(base, `/api/projects/${projectId}/select`, {
    method: 'POST',
    body: JSON.stringify({ dishId: 'biryani' }),
  });
  await request(base, `/api/projects/${projectId}/storyboard`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const blocked = await request(base, `/api/projects/${projectId}/generate/clips`, {
    method: 'POST',
    body: JSON.stringify({ stageIds: ['S01'] }),
  });
  assert.equal(blocked.response.status, 409);
  assert.equal(blocked.body.error, 'approved_image_required');
});
