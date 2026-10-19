import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

process.env.VIDMO_DATA_DIR = path.join(os.tmpdir(), `vidmo-test-${process.pid}-${Date.now()}`);
delete process.env.VIDMO_RENDER_WEBHOOK;
delete process.env.VIDMO_RENDER_CALLBACK_SECRET;
delete process.env.OPENAI_API_KEY;
delete process.env.VIDMO_AI_API_KEY;

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
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  let body;
  if (contentType.includes('application/json')) body = await response.json();
  else body = await response.text();
  return { response, body };
}

test('api workflow: audience → ideas → dish → storyboard → edits → exports', async (t) => {
  const { server, base } = await startServer();
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(process.env.VIDMO_DATA_DIR, { recursive: true, force: true }).catch(() => {});
  });

  const health = await request(base, '/api/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.body.ok, true);

  const bootstrap = await request(base, '/api/bootstrap');
  assert.equal(bootstrap.response.status, 200);
  assert.equal(bootstrap.body.projects.length, 0);
  assert.equal(bootstrap.body.settings.videoModels.length, 4);
  assert.equal(typeof bootstrap.body.ai.configured, 'boolean');

  const invalid = await request(base, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ audience: 'mars' }),
  });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error, 'invalid_audience');

  const created = await request(base, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ audience: 'western' }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.ideas.length, 10);
  assert.equal(created.body.project.status, 'ideas');
  assert.equal(created.body.project.activeStep, 2);
  const projectId = created.body.project.id;

  const list = await request(base, '/api/projects');
  assert.equal(list.body.projects.length, 1);
  assert.equal(list.body.projects[0].id, projectId);

  const selection = await request(base, `/api/projects/${projectId}/select`, {
    method: 'POST',
    body: JSON.stringify({ dishId: 'cheeseburger' }),
  });
  assert.equal(selection.response.status, 200);
  assert.equal(selection.body.project.dish.name, 'Cheeseburger');
  assert.equal(selection.body.project.status, 'breakdown');
  assert.equal(selection.body.project.activeStep, 3);

  const storyboard = await request(base, `/api/projects/${projectId}/storyboard`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(storyboard.response.status, 200);
  assert.equal(storyboard.body.project.storyboard.totalStages, 7);
  assert.equal(storyboard.body.project.storyboard.audit.passed, true);
  assert.ok(storyboard.body.project.storyboard.stages[0].motionPrompt.includes('NO MUSIC'));

  const editedPrompt = storyboard.body.project.storyboard.stages[0].imagePrompt.replace(
    /EXTREME MACRO PHOTOGRAPHY/,
    'A photo',
  );
  const edited = await request(base, `/api/projects/${projectId}/stage/1`, {
    method: 'PATCH',
    body: JSON.stringify({ imagePrompt: editedPrompt }),
  });
  assert.equal(edited.response.status, 200);
  assert.equal(edited.body.project.storyboard.stages[0].compliance.passed, false);
  assert.ok(edited.body.project.storyboard.stages[0].compliance.missing.includes('Extreme macro'));

  const rerolled = await request(base, `/api/projects/${projectId}/stage/1/reroll`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(rerolled.response.status, 200);
  assert.equal(rerolled.body.project.storyboard.stages[0].compliance.passed, true);
  assert.notEqual(rerolled.body.project.storyboard.stages[0].imagePrompt, editedPrompt);

  for (const format of ['md', 'csv', 'json', 'handoff']) {
    const exported = await fetch(`${base}/api/projects/${projectId}/export?format=${format}`);
    const exportedText = await exported.text();
    assert.equal(exported.status, 200, `export ${format} should succeed`);
    assert.ok(exportedText.length > 500, `export ${format} should not be empty`);
  }

  const zip = await fetch(`${base}/api/projects/${projectId}/export?format=zip`);
  assert.equal(zip.status, 200);
  const zipBuffer = Buffer.from(await zip.arrayBuffer());
  assert.equal(zipBuffer.readUInt32LE(0), 0x04034b50);
  assert.ok(zipBuffer.length > 5000);

  const render = await request(base, `/api/projects/${projectId}/render`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(render.response.status, 409);
  assert.equal(render.body.error, 'render_bridge_unconfigured');

  const deleted = await request(base, `/api/projects/${projectId}`, { method: 'DELETE' });
  assert.equal(deleted.response.status, 204);
  const missing = await request(base, `/api/projects/${projectId}`);
  assert.equal(missing.response.status, 404);
});

test('api supports custom dishes with auto complexity and export safety', async (t) => {
  const { server, base } = await startServer();
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(process.env.VIDMO_DATA_DIR, { recursive: true, force: true }).catch(() => {});
  });

  const analyze = await request(base, '/api/analyze', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Chicken Biryani',
      ingredients: 'rice, chicken, saffron',
      audience: 'desi',
    }),
  });
  assert.equal(analyze.response.status, 200);
  assert.equal(analyze.body.analysis.complexity, 'complex');
  assert.ok(analyze.body.analysis.stageCount >= 8);

  const created = await request(base, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({ audience: 'desi' }),
  });
  const projectId = created.body.project.id;

  const select = await request(base, `/api/projects/${projectId}/select`, {
    method: 'POST',
    body: JSON.stringify({
      dishId: 'custom',
      customDish: { name: 'Chicken Biryani', ingredients: 'rice, chicken, saffron, yogurt' },
      useAi: false,
    }),
  });
  assert.equal(select.response.status, 200);
  assert.equal(select.body.project.dish.custom, true);
  assert.equal(select.body.project.dish.complexity, 'complex');

  const storyboard = await request(base, `/api/projects/${projectId}/storyboard`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(storyboard.body.project.storyboard.audit.passed, true);
  const desiStage = storyboard.body.project.storyboard.stages[0];
  assert.ok(desiStage.imagePrompt.includes('village courtyard'));
  assert.ok(!desiStage.imagePrompt.toLowerCase().includes('gloves are allowed'));

  const traversal = await fetch(`${base}/../server.js`);
  assert.ok([403, 404].includes(traversal.status), 'path traversal must be blocked');
});
