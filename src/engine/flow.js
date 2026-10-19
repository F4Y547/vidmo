function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function slug(value) {
  return String(value ?? 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export function buildFlowImagePrompt(stage) {
  return `Generate one still image in Google Flow. Use the vertical 9:16 image model (Nano Banana Pro, or Flow's default image model). Do not add text, captions or a watermark.\n\n${stage.imagePrompt}`;
}

export function buildFlowVideoPrompt(stage) {
  return `Use the uploaded stage image as the exact first frame. Keep its composition, hands, cookware, light and scale unchanged at the start. Generate one continuous 9:16 shot with no cuts, no scene changes and no text overlays.\n\n${stage.motionPrompt}\n\nIf the selected Flow model generates audio, it must contain ONLY realistic ASMR sound effects synced to visible action. NO MUSIC. NO BACKGROUND MUSIC. NO SONGS. NO VOICEOVER. NO DIALOGUE. NO HUMAN SPEECH.`;
}

export function buildFlowManifest(project, assets = []) {
  const storyboard = project.storyboard;
  const byStage = new Map();
  for (const asset of assets) {
    if (!byStage.has(asset.stageId)) byStage.set(asset.stageId, []);
    byStage.get(asset.stageId).push(asset);
  }
  return {
    schema: 'vidmo.flow-pack/v1',
    generatedAt: new Date().toISOString(),
    projectId: project.id,
    title: project.title,
    flowUrl: 'https://labs.google/fx/tools/flow',
    aspect: storyboard.aspect,
    stages: storyboard.stages.map((stage, index) => {
      const stageAssets = byStage.get(stage.id) ?? [];
      return {
        stageId: stage.id,
        index: index + 1,
        name: stage.name,
        duration: stage.duration,
        imagePrompt: buildFlowImagePrompt(stage),
        videoPrompt: buildFlowVideoPrompt(stage),
        approved: {
          image: stageAssets.some((item) => item.kind === 'image' && item.asset?.approved),
          clip: stageAssets.some((item) => item.kind === 'clip' && item.asset?.approved),
        },
        assets: stageAssets.map((item) => ({
          kind: item.kind,
          file: item.name,
          source: item.asset?.source ?? null,
          model: item.asset?.model ?? null,
          approved: Boolean(item.asset?.approved),
        })),
      };
    }),
  };
}

export function buildFlowShotListCsv(project, assets = []) {
  const byStage = new Map();
  for (const asset of assets) {
    if (!byStage.has(asset.stageId)) byStage.set(asset.stageId, []);
    byStage.get(asset.stageId).push(asset);
  }
  const header = [
    'stage',
    'shot_id',
    'name',
    'duration_seconds',
    'image_asset',
    'clip_asset',
    'image_approved',
    'clip_approved',
    'image_prompt',
    'video_prompt',
  ];
  const rows = project.storyboard.stages.map((stage, index) => {
    const stageAssets = byStage.get(stage.id) ?? [];
    const image = stageAssets.find((item) => item.kind === 'image');
    const clip = stageAssets.find((item) => item.kind === 'clip');
    return [
      index + 1,
      stage.id,
      stage.name,
      stage.duration,
      image?.name ?? '',
      clip?.name ?? '',
      image ? (image.asset?.approved ? 'yes' : 'no') : '',
      clip ? (clip.asset?.approved ? 'yes' : 'no') : '',
      buildFlowImagePrompt(stage),
      buildFlowVideoPrompt(stage),
    ];
  });
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')}\r\n`;
}

function assetLinks(stageAssets) {
  if (!stageAssets.length) {
    return '<p class="none">No media in this pack yet. Generate it in Flow, or import it into VidMo and export again.</p>';
  }
  return `<div class="media-links">${stageAssets
    .map((item) => {
      const relative = item.name.replace(/^assets\//, '../assets/');
      return item.kind === 'image'
        ? `<a href="${escapeHtml(relative)}" target="_blank" rel="noreferrer">Open image · ${escapeHtml(
            item.downloadName ?? item.name,
          )}</a>`
        : `<a href="${escapeHtml(relative)}" target="_blank" rel="noreferrer">Open clip · ${escapeHtml(
            item.downloadName ?? item.name,
          )}</a>`;
    })
    .join('')}</div>`;
}

export function buildFlowBoardHtml(project, assets = []) {
  const byStage = new Map();
  for (const asset of assets) {
    if (!byStage.has(asset.stageId)) byStage.set(asset.stageId, []);
    byStage.get(asset.stageId).push(asset);
  }
  const cards = project.storyboard.stages
    .map((stage, index) => {
      const imagePrompt = buildFlowImagePrompt(stage);
      const videoPrompt = buildFlowVideoPrompt(stage);
      const stageAssets = byStage.get(stage.id) ?? [];
      const image = stageAssets.find((item) => item.kind === 'image');
      return `
      <article class="shot">
        <header>
          <span class="num">${String(index + 1).padStart(2, '0')}</span>
          <div><h2>${escapeHtml(stage.name)}</h2><p>${escapeHtml(stage.id)} · ${stage.duration}s · ${escapeHtml(stage.camera)}</p></div>
        </header>
        ${
          image
            ? `<img class="preview" src="${escapeHtml(
                image.name.replace(/^assets\//, '../assets/'),
              )}" alt="${escapeHtml(stage.name)} stage image" loading="lazy" />`
            : '<div class="preview empty">Stage image not generated yet</div>'
        }
        <section>
          <div class="label"><span>Image prompt</span><button data-copy="${escapeHtml(
            imagePrompt,
          )}" type="button">Copy</button></div>
          <pre>${escapeHtml(imagePrompt)}</pre>
        </section>
        <section>
          <div class="label"><span>Video prompt · upload the image as the start frame</span><button data-copy="${escapeHtml(
            videoPrompt,
          )}" type="button">Copy</button></div>
          <pre>${escapeHtml(videoPrompt)}</pre>
        </section>
        ${assetLinks(stageAssets)}
      </article>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(project.dish?.name ?? project.title)} — Flow board</title>
<style>
  :root { color-scheme: dark; --bg:#0b0a09; --panel:#171411; --line:rgba(244,232,214,.12); --text:#f6efe3; --muted:#b0a490; --amber:#f2a65a; --teal:#7fb2ad; }
  * { box-sizing:border-box; }
  body { margin:0; background:radial-gradient(900px 600px at 15% 0%,rgba(242,166,90,.08),transparent 60%),var(--bg); color:var(--text); font:15px/1.6 "Segoe UI",system-ui,sans-serif; }
  main { width:min(1180px,calc(100% - 32px)); margin:0 auto; padding:40px 0 80px; }
  h1 { font:600 clamp(30px,5vw,52px)/1.08 Georgia,serif; margin:0 0 8px; }
  .lede { color:var(--muted); max-width:70ch; margin:0 0 8px; }
  .notice { border:1px solid rgba(242,166,90,.35); background:rgba(242,166,90,.07); padding:12px 16px; border-radius:12px; margin:18px 0 26px; font-size:13px; color:#e8d8c2; }
  .shots { display:grid; gap:22px; }
  .shot { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:22px; }
  .shot header { display:flex; gap:14px; align-items:flex-start; margin-bottom:14px; }
  .num { display:grid; place-items:center; width:38px; height:38px; flex:none; border-radius:10px; background:rgba(242,166,90,.12); color:var(--amber); font:600 13px/1 ui-monospace,monospace; }
  h2 { font:600 22px/1.2 Georgia,serif; margin:0; }
  .shot header p { margin:2px 0 0; color:var(--muted); font-size:12px; }
  .preview { width:100%; max-width:300px; aspect-ratio:9/16; object-fit:cover; border-radius:12px; border:1px solid var(--line); }
  .preview.empty { display:grid; place-items:center; color:var(--muted); font-size:12px; background:rgba(0,0,0,.3); }
  section { margin-top:16px; }
  .label { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:6px; color:var(--muted); font-size:11px; letter-spacing:.12em; text-transform:uppercase; }
  button { border:1px solid var(--line); background:rgba(244,232,214,.03); color:var(--text); border-radius:8px; padding:6px 10px; font:inherit; font-size:12px; cursor:pointer; }
  button:hover { border-color:var(--amber); color:var(--amber); }
  pre { margin:0; padding:12px 14px; border:1px solid var(--line); border-radius:10px; background:rgba(0,0,0,.28); white-space:pre-wrap; word-break:break-word; color:#d9cfbe; font:12px/1.6 ui-monospace,monospace; max-height:280px; overflow:auto; }
  .media-links { display:flex; flex-wrap:wrap; gap:12px; margin-top:14px; }
  .media-links a { color:var(--teal); font-size:12px; }
  .none { color:var(--muted); font-size:12px; margin:10px 0 0; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(project.dish?.name ?? project.title)} — Google Flow board</h1>
  <p class="lede">${escapeHtml(project.storyboard.audience)} · ${project.storyboard.totalStages} stages · ${project.storyboard.aspect} · locked ASMR-only audio. Work through the stages in order, keep the same scale, hands, cookware, light and sound.</p>
  <div class="notice"><strong>Image first, then motion.</strong> Generate every stage image, review it against the continuity bible, then upload the approved image as the start frame for the video prompt. Audio must be ASMR only: no music, no voiceover, no dialogue.</div>
  <div class="shots">${cards}</div>
</main>
<script>
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy || '');
    const old = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = old; }, 1400);
  } catch {
    window.prompt('Copy this prompt:', button.dataset.copy || '');
  }
});
</script>
</body>
</html>`;
}

export function buildFlowPackReadme(project) {
  return `VIDMO × GOOGLE FLOW — GENERATION PACK
=====================================

${project.dish?.name ?? project.title}
Audience: ${project.storyboard.audience}
Stages: ${project.storyboard.totalStages}
Runtime: ${project.storyboard.totalDuration}s
Aspect: ${project.storyboard.aspect}

WHAT THIS PACK IS
-----------------
A reviewable bridge between VidMo's locked storyboard and Google Flow's
browser UI. Flow has no public generation API. Use this pack if you prefer to
work manually, or connect VidMo's optional Flow session to automate the same
steps in a visible Chrome window.

FILES
-----
board.html                 Open in a browser: prompts, copy buttons and media
shot-list.csv              Spreadsheet of every image/video prompt + assets
manifest.json              Machine-readable stage/asset map
prompts/S01-image.txt      Locked image prompt per stage
prompts/S01-video.txt      Motion prompt with the ASMR lock, per stage
media/                     Media that was exported from VidMo, if any
assets/                    Generated/imported media included with the ZIP

MANUAL FLOW WORKFLOW
--------------------
1. Open https://labs.google/fx/tools/flow and sign in with your own account.
2. Create a new project and choose the image model (Nano Banana Pro or default).
3. Set the aspect ratio to 9:16. Paste each stage image prompt and generate.
4. Review every image against continuity-bible.md. Keep the same scale, hands,
   table surface, cookware, palette and light direction.
5. Switch Flow to Video. Choose a video model, add the approved stage image as
   the start frame, paste the video prompt, and generate one clip per stage.
6. Download the clips and import them into the matching stage in VidMo, or
   generate them directly from the Storyboard screen.
7. Edit with the stage audio prompts only. No music, no voiceover, no dialogue.

AUTOMATED FLOW WORKFLOW
-----------------------
1. In VidMo, open the Flow panel and click Connect Flow.
2. Sign in manually in the visible Chrome window. VidMo never receives or stores
   your password, cookies or Google credentials.
3. Generate all images, review/approve them, then generate clips.
4. If Flow shows a captcha, credit warning, new terms or a changed UI, VidMo
   pauses and saves a screenshot. Resolve it in the Flow window, then Resume.
5. Capture diagnostics if a selector stops working. The JSON/screenshot stays
   local in data/flow/diagnostics.

AUDIO POLICY
------------
ONLY realistic ASMR sound effects. NO MUSIC. NO BACKGROUND MUSIC. NO SONGS.
NO VOICEOVER. NO DIALOGUE. NO HUMAN SPEECH.

CREDITS & ACCOUNT
-----------------
Flow generations consume Flow credits from your own Google account. VidMo does
not include, proxy or resell credits. Check your Flow balance before starting a
batch. Flow is a third-party service; its UI, models, limits and terms can
change at any time. This pack is the stable fallback.

Generated by VidMo Studio.
`;
}

export function buildFlowImportInstructions(project) {
  return `# Importing Flow media back into VidMo

VidMo accepts a downloaded image or clip for any stage, so you can mix manual Flow
work with automated generation.

1. Open the film in VidMo.
2. Go to **Storyboard**.
3. In the stage's **Flow assets** panel, click **Upload image** or **Upload clip**.
4. Choose the file downloaded from Google Flow.
5. For an image, click **Approve image** after reviewing continuity. Clips can
   only be generated from an approved stage image.
6. Open **Production pack** and download the ZIP. Approved media is included in
   the pack and in the Flow board.

Accepted files: PNG, JPEG, WebP for images; MP4, WebM, MOV for clips.
Maximum upload size: ${Math.round(Number(process.env.VIDMO_MAX_UPLOAD_BYTES || 250 * 1024 * 1024) / (1024 * 1024))} MB.

Naming does not matter. VidMo stores a local copy and records the stage, source,
prompt hash, model, dimensions and approval state.

Project: ${project.title}
Generated: ${new Date().toISOString()}
`;
}

export function buildFlowPackFiles(project, assets = []) {
  const files = [
    { name: 'flow/README.md', data: buildFlowPackReadme(project) },
    { name: 'flow/shot-list.csv', data: buildFlowShotListCsv(project, assets) },
    { name: 'flow/manifest.json', data: JSON.stringify(buildFlowManifest(project, assets), null, 2) },
    { name: 'flow/board.html', data: buildFlowBoardHtml(project, assets) },
    { name: 'flow/import-back.md', data: buildFlowImportInstructions(project) },
  ];
  for (const [index, stage] of project.storyboard.stages.entries()) {
    const number = String(index + 1).padStart(2, '0');
    files.push({
      name: `flow/prompts/S${number}-image.txt`,
      data: buildFlowImagePrompt(stage),
    });
    files.push({
      name: `flow/prompts/S${number}-video.txt`,
      data: buildFlowVideoPrompt(stage),
    });
  }
  return files;
}
