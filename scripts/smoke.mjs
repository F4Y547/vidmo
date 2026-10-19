#!/usr/bin/env node
/**
 * VidMo Studio live smoke test.
 *
 * Walks the entire production flow against a RUNNING server:
 *   health → bootstrap → flow status → create project → ideas → library dish →
 *   storyboard → edit + reroll → exports (md/csv/json/handoff/zip/flow) →
 *   stub Flow generation (images → approval → clips → media) →
 *   custom dish → static web client assets → cleanup.
 *
 * Usage:
 *   npm start            (in one terminal; add VIDMO_FLOW_MODE=stub to test generation)
 *   npm run smoke        (in another)   — or: node scripts/smoke.mjs http://127.0.0.1:4173
 *
 * The generation section only runs when the server reports flowMode "stub", so
 * the smoke test never spends real Flow credits.
 */

const BASE = (process.argv[2] || process.env.VIDMO_SMOKE_BASE || 'http://127.0.0.1:4173').replace(/\/+$/, '');

let passed = 0;
let failed = 0;
const createdProjects = [];

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  let body;
  if (contentType.includes('application/json')) body = await response.json().catch(() => null);
  else body = await response.text();
  return { response, body };
}

async function cleanup() {
  for (const id of createdProjects) {
    await request(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
  }
}

async function waitForGeneration(projectId, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = await request(`/api/projects/${projectId}/generation`);
    const status = state.body?.generation?.status;
    if (['complete', 'partial', 'error', 'cancelled', 'interrupted'].includes(status)) {
      return state.body.generation;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

function zipEntryNames(buffer) {
  const names = [];
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) return names;
  const count = buffer.readUInt16LE(end + 10);
  let pointer = buffer.readUInt32LE(end + 16);
  for (let index = 0; index < count && pointer + 46 <= buffer.length; index += 1) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) break;
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    names.push(buffer.toString('utf8', pointer + 46, pointer + 46 + nameLength));
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

function countAssets(generation, kind) {
  return Object.values(generation?.stages ?? {}).reduce(
    (sum, stage) => sum + (stage?.[kind]?.length ?? 0),
    0,
  );
}

async function main() {
  console.log(`VidMo Studio smoke test → ${BASE}`);

  section('Health & bootstrap');
  const health = await request('/api/health');
  check('server is up', health.response.status === 200 && health.body?.ok === true);
  if (health.response.status !== 200) {
    console.error('\nServer is not reachable. Start it with: npm start');
    process.exit(1);
  }

  const bootstrap = await request('/api/bootstrap');
  check('bootstrap returns audiences', Array.isArray(bootstrap.body?.audiences) && bootstrap.body.audiences.length === 2);
  check('audience cards carry cultural continuity rules',
    bootstrap.body?.audiences?.every((a) =>
      Array.isArray(a.cardRules) && a.cardRules.length >= 4 &&
      a.cardRules.every((rule) => rule.icon && rule.label && rule.value)));
  check('video model options exposed', bootstrap.body?.settings?.videoModels?.length === 4);
  check('health reports the Flow mode', ['browser', 'stub'].includes(health.body?.flowMode),
    `flowMode ${health.body?.flowMode}`);
  check('bootstrap exposes Flow status',
    bootstrap.body?.flow?.mode === health.body.flowMode &&
    typeof bootstrap.body.flow.status === 'string');
  check('Flow report never exposes credentials',
    !/password|cookie|token/i.test(JSON.stringify(bootstrap.body?.flow ?? {})));

  section('Step 1–2: audience → 10 dish ideas (Western)');
  const created = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ audience: 'western' }),
  });
  check('project created', created.response.status === 201, `status ${created.response.status}`);
  const projectId = created.body?.project?.id;
  if (!projectId) throw new Error('no project id returned');
  createdProjects.push(projectId);
  check('exactly 10 ideas offered', created.body?.ideas?.length === 10);
  check('workflow parked at step 2 (ideas)',
    created.body?.project?.status === 'ideas' && created.body.project.activeStep === 2);

  section('Step 3: library dish selection');
  const selection = await request(`/api/projects/${projectId}/select`, {
    method: 'POST',
    body: JSON.stringify({ dishId: 'fish-and-chips' }),
  });
  check('library dish selected', selection.response.status === 200, `status ${selection.response.status}`);
  check('advances to breakdown (step 3)', selection.body?.project?.activeStep === 3);

  section('Step 4–5: storyboard build + rule locks');
  const storyboard = await request(`/api/projects/${projectId}/storyboard`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  check('storyboard built', storyboard.response.status === 200, `status ${storyboard.response.status}`);
  const sb = storyboard.body?.project?.storyboard;
  const stages = sb?.stages ?? [];
  check('stage count inside complexity range', stages.length >= 3 && stages.length <= 12, `${stages.length} stages`);
  check('every stage has image + motion + audio prompts',
    stages.every((s) => s.imagePrompt && s.motionPrompt && s.audioPrompt));
  check('audio lock: ASMR only in every stage',
    stages.every((s) => s.audioPrompt.includes('ONLY REALISTIC ASMR SOUND EFFECTS')));
  check('audio lock: no music/voice in every stage',
    stages.every((s) =>
      s.audioPrompt.includes('NO MUSIC. NO BACKGROUND MUSIC. NO SONGS. NO VOICEOVER. NO DIALOGUE. NO HUMAN SPEECH.')));
  check('image lock: extreme macro in every stage',
    stages.every((s) => s.imagePrompt.includes('EXTREME MACRO PHOTOGRAPHY')));
  check('giant-hands scale contrast in every stage',
    stages.every((s) => s.imagePrompt.includes('Giant human hands compared to the tiny food')));
  const last = stages[stages.length - 1];
  check('final stage is the plating hero shot',
    /plating|garnish|hero/i.test(`${last.imagePrompt} ${last.motionPrompt}`));
  check('storyboard audit passes', sb?.audit?.passed === true);

  section('Step 5: stage editing + reroll');
  const originalPrompt = stages[0].imagePrompt;
  const tampered = originalPrompt.replace(/EXTREME MACRO PHOTOGRAPHY/, 'a photograph');
  const edited = await request(`/api/projects/${projectId}/stage/1`, {
    method: 'PATCH',
    body: JSON.stringify({ imagePrompt: tampered }),
  });
  check('stage edit saved', edited.response.status === 200);
  check('audit flags the broken lock',
    edited.body?.project?.storyboard?.stages?.[0]?.compliance?.passed === false &&
    edited.body.project.storyboard.stages[0].compliance.missing.includes('Extreme macro'));
  const rerolled = await request(`/api/projects/${projectId}/stage/1/reroll`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  check('reroll restores compliance',
    rerolled.response.status === 200 &&
    rerolled.body?.project?.storyboard?.stages?.[0]?.compliance?.passed === true);
  check('reroll changed the prompt',
    rerolled.body?.project?.storyboard?.stages?.[0]?.imagePrompt !== tampered);

  section('Step 5: production exports');
  for (const format of ['md', 'csv', 'json', 'handoff']) {
    const exported = await request(`/api/projects/${projectId}/export?format=${format}`);
    const size = typeof exported.body === 'string'
      ? exported.body.length
      : JSON.stringify(exported.body ?? '').length;
    check(`export ${format}`, exported.response.status === 200 && size > 500, `size ${size}`);
  }
  const zip = await fetch(`${BASE}/api/projects/${projectId}/export?format=zip`);
  const zipBuffer = Buffer.from(await zip.arrayBuffer());
  check('export zip pack is a valid archive', zip.status === 200 && zipBuffer.length > 5000);
  check('zip has local-file signature',
    zipBuffer.length >= 4 && zipBuffer.readUInt32LE(0) === 0x04034b50);
  const markdown = await (await fetch(`${BASE}/api/projects/${projectId}/export?format=md`)).text();
  check('markdown export carries the ASMR-only mandate', markdown.includes('NO MUSIC'));
  check('markdown export carries social copy', /hashtag|caption|hook/i.test(markdown));

  const flowPack = await fetch(`${BASE}/api/projects/${projectId}/export?format=flow`);
  const flowBuffer = Buffer.from(await flowPack.arrayBuffer());
  const flowEntries = zipEntryNames(flowBuffer);
  check('flow pack export is a valid archive',
    flowPack.status === 200 && flowBuffer.readUInt32LE(0) === 0x04034b50);
  check('flow pack contains the browser board', flowEntries.includes('flow/board.html'));
  check('flow pack contains the manifest and shot list',
    flowEntries.includes('flow/manifest.json') && flowEntries.includes('flow/shot-list.csv'));
  check('flow pack contains per-stage image and video prompts',
    flowEntries.includes('flow/prompts/S01-image.txt') &&
    flowEntries.includes('flow/prompts/S01-video.txt') &&
    flowEntries.filter((name) => /^flow\/prompts\/S\d+-image\.txt$/.test(name)).length === stages.length);
  check('flow pack documents manual import', flowEntries.includes('flow/import-back.md'));

  section('Google Flow generation (stub server)');
  if (health.body.flowMode !== 'stub') {
    console.log(
      `  SKIP  server flowMode is "${health.body.flowMode}". Restart with VIDMO_FLOW_MODE=stub to exercise generation end-to-end.`,
    );
  } else {
    const stageIds = stages.map((stage) => stage.id);
    const imageBatch = await request(`/api/projects/${projectId}/generate/images`, {
      method: 'POST',
      body: JSON.stringify({ stageIds }),
    });
    check('image batch accepted', imageBatch.response.status === 202, `status ${imageBatch.response.status}`);
    const imageGeneration = await waitForGeneration(projectId);
    check('stub image batch completed', imageGeneration?.status === 'complete', imageGeneration?.message);
    check('one generated image per stage',
      countAssets(imageGeneration, 'images') === stages.length,
      `${countAssets(imageGeneration, 'images')}/${stages.length}`);
    check('generated images carry prompt metadata',
      Object.values(imageGeneration?.stages ?? {}).every((stage) =>
        stage.images?.every((asset) => asset.promptHash && asset.model && asset.bytes > 0)));

    const approved = await request(`/api/projects/${projectId}/approve-images`, {
      method: 'POST',
      body: JSON.stringify({ approved: true }),
    });
    check('approve-all images succeeds', approved.response.status === 200);
    check('every stage has an approved image',
      Object.values(approved.body?.project?.generation?.stages ?? {}).every(
        (stage) => Boolean(stage.approvedImageId)));

    const firstStageId = Object.keys(approved.body.project.generation.stages)[0];
    const firstImage = approved.body.project.generation.stages[firstStageId].images.at(-1);
    const mediaUrl = `${BASE}/api/projects/${projectId}/media/${encodeURIComponent(firstStageId)}/${encodeURIComponent(firstImage.file)}`;
    const media = await fetch(mediaUrl);
    const mediaBytes = await media.arrayBuffer();
    check('media endpoint serves the generated image',
      media.status === 200 &&
      (media.headers.get('content-type') ?? '').startsWith('image/') &&
      mediaBytes.byteLength > 0);
    const ranged = await fetch(mediaUrl, { headers: { Range: 'bytes=0-9' } });
    check('media endpoint supports range requests',
      ranged.status === 206 && (ranged.headers.get('content-range') ?? '').startsWith('bytes 0-9/'));

    const clipBatch = await request(`/api/projects/${projectId}/generate/clips`, {
      method: 'POST',
      body: JSON.stringify({ stageIds }),
    });
    check('clip batch accepted', clipBatch.response.status === 202);
    const clipGeneration = await waitForGeneration(projectId);
    check('stub clip batch completed', clipGeneration?.status === 'complete', clipGeneration?.message);
    check('one clip per stage',
      countAssets(clipGeneration, 'clips') === stages.length,
      `${countAssets(clipGeneration, 'clips')}/${stages.length}`);

    const mediaPack = await fetch(`${BASE}/api/projects/${projectId}/export?format=flow`);
    const mediaEntries = zipEntryNames(Buffer.from(await mediaPack.arrayBuffer()));
    check('flow pack includes generated media',
      mediaEntries.some((name) => /^assets\/S\d+-image-/.test(name)) &&
      mediaEntries.some((name) => /^assets\/S\d+-clip-/.test(name)));
  }

  section('Custom dish (Indian & Pakistani audience)');
  const desi = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ audience: 'desi' }),
  });
  const desiId = desi.body?.project?.id;
  if (desiId) createdProjects.push(desiId);
  check('desi project created', Boolean(desiId) && desi.response.status === 201);
  const customSelect = await request(`/api/projects/${desiId}/select`, {
    method: 'POST',
    body: JSON.stringify({
      dishId: 'custom',
      customDish: { name: 'Chicken Karahi', ingredients: 'chicken, tomato, ginger, green chili, ghee' },
      useAi: false,
    }),
  });
  check('custom dish accepted', customSelect.response.status === 200);
  check('custom dish analyzed to a complexity tier',
    ['simple', 'medium', 'complex'].includes(customSelect.body?.project?.dish?.complexity));
  const desiBoard = await request(`/api/projects/${desiId}/storyboard`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const desiStages = desiBoard.body?.project?.storyboard?.stages ?? [];
  check('custom storyboard built within complexity range', desiStages.length >= 3 && desiStages.length <= 12);
  check('desi environment continuity (village courtyard)',
    desiStages.every((s) => s.imagePrompt.includes('village courtyard')));
  check('desi hands rule (no gloves)',
    desiStages.every((s) => !s.imagePrompt.toLowerCase().includes('gloves are allowed')));
  check('custom storyboard audit passes', desiBoard.body?.project?.storyboard?.audit?.passed === true);

  section('Static web client');
  const index = await fetch(`${BASE}/`);
  const html = await index.text();
  check('index.html served', index.status === 200 && html.includes('VidMo Studio'));
  for (const asset of ['/styles.css', '/app.js', '/art.js', '/assets/favicon.svg']) {
    const assetResponse = await fetch(`${BASE}${asset}`);
    const text = await assetResponse.text();
    check(`${asset} served`, assetResponse.status === 200 && text.length > 100, `status ${assetResponse.status}`);
  }
  check('path traversal blocked', (await fetch(`${BASE}/../server.js`)).status !== 200);

  section('Cleanup');
  await cleanup();
  const remaining = await request('/api/projects');
  const leftovers = (remaining.body?.projects ?? []).filter((p) => createdProjects.includes(p.id));
  check('smoke projects deleted', leftovers.length === 0);
}

main()
  .then(async () => {
    console.log(`\n${failed === 0 ? 'SMOKE OK' : 'SMOKE FAILED'} — ${passed} passed, ${failed} failed`);
    await cleanup();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error(`\nSmoke test crashed: ${error.stack || error.message}`);
    await cleanup();
    process.exit(1);
  });
