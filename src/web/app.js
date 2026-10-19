import { audienceArt, dishTile, logoMark, stageFrame } from './art.js';

/* ==========================================================================
   helpers
   ========================================================================== */

const $ = (selector, root = document) => root.querySelector(selector);

const SECTION_LABELS = {
  audience: 'Audience',
  ideas: 'Dish choice',
  breakdown: 'Stage plan',
  storyboard: 'Storyboard',
  production: 'Production pack',
};

const STEPS = [
  { id: '1', section: 'audience', label: 'Audience', hint: 'Lock culture + hands' },
  { id: '2·3', section: 'ideas', label: 'Dish choice', hint: '10 ideas or your own' },
  { id: '4', section: 'breakdown', label: 'Stage plan', hint: 'Auto recipe analysis' },
  { id: '5', section: 'storyboard', label: 'Storyboard', hint: 'Image · motion · audio' },
  { id: '5+', section: 'production', label: 'Production pack', hint: 'Export + render bridge' },
];

const COMPLEXITY_CHIP = {
  simple: 'chip-sage',
  medium: 'chip-amber',
  complex: 'chip-chili',
};

const PROMPT_META = {
  image: { field: 'imagePrompt', label: 'Image prompt', color: 'var(--amber)', icon: '◉' },
  motion: { field: 'motionPrompt', label: 'Motion prompt', color: 'var(--teal)', icon: '➤' },
  audio: { field: 'audioPrompt', label: 'Audio prompt', color: 'var(--sage)', icon: '♪' },
};

const state = {
  bootstrap: null,
  projects: [],
  project: null,
  ai: null,
  render: null,
  flow: null,
  settings: null,
  routeSection: null,
  ideasFilter: 'all',
  customDraft: readJson('vidmo.customDraft', { name: '', ingredients: '' }),
  customAnalysis: null,
  customAnalysisTimer: null,
  analysisToken: 0,
  editing: null,
  expanded: {},
  modal: null,
  busy: false,
  flowConsent: Boolean(readJson('vidmo.flowConsent', false)),
  flowDiagnostics: null,
  flowSignature: null,
  flowTimer: null,
  generationTimer: null,
  lastGenerationStatus: null,
  lastGenerationCount: -1,
  polling: false,
};

function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function runtime(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function shortDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function flowStatusLabel(flow = state.flow) {
  if (!flow) return 'Flow: not connected';
  if (flow.mode === 'stub' && flow.status === 'ready') return 'Flow: simulator';
  const labels = {
    ready: 'Flow: connected',
    busy: 'Flow: generating',
    launching: 'Flow: opening',
    awaiting_login: 'Flow: sign in',
    attention: 'Flow: needs you',
    paused: 'Flow: paused',
    error: 'Flow: error',
    disconnected: 'Flow: not connected',
  };
  return labels[flow.status] ?? 'Flow: not connected';
}

function isFlowConnected() {
  const flow = state.flow;
  if (!flow) return false;
  if (flow.mode === 'stub') return true;
  return flow.status === 'ready' || flow.status === 'busy';
}

function isGenerationActive(generation = state.project?.generation) {
  return Boolean(
    generation && ['queued', 'running', 'attention', 'cancelling'].includes(generation.status),
  );
}

function generationSummary(generation = state.project?.generation) {
  const stages = state.project?.storyboard?.stages ?? [];
  const stageMap = generation?.stages ?? {};
  const summary = { images: 0, clips: 0, approvedImages: 0, approvedClips: 0 };
  for (const stage of stages) {
    const stageState = stageMap[stage.id];
    summary.images += stageState?.images?.length ?? 0;
    summary.clips += stageState?.clips?.length ?? 0;
    if (stageState?.approvedImageId) summary.approvedImages += 1;
    if (stageState?.approvedClipId) summary.approvedClips += 1;
  }
  return summary;
}

function stageGeneration(stageId) {
  return state.project?.generation?.stages?.[stageId] ?? null;
}

function assetById(stageId, assetId) {
  const generation = stageGeneration(stageId);
  if (!generation) return null;
  return (
    [...(generation.images ?? []), ...(generation.clips ?? [])].find(
      (asset) => asset.id === assetId,
    ) ?? null
  );
}

function selectedImage(stageId) {
  const generation = stageGeneration(stageId);
  if (!generation) return null;
  return (
    generation.images?.find((asset) => asset.id === generation.approvedImageId) ??
    generation.images?.find((asset) => asset.approved) ??
    generation.images?.at(-1) ??
    null
  );
}

function selectedClip(stageId) {
  const generation = stageGeneration(stageId);
  if (!generation) return null;
  return (
    generation.clips?.find((asset) => asset.id === generation.approvedClipId) ??
    generation.clips?.find((asset) => asset.approved) ??
    generation.clips?.at(-1) ??
    null
  );
}

function mediaUrl(projectId, stageId, file, { download = false } = {}) {
  if (!file) return '';
  return `/api/projects/${encodeURIComponent(projectId)}/media/${encodeURIComponent(
    stageId,
  )}/${encodeURIComponent(file)}${download ? '?download=1' : ''}`;
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function assetAge(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }
  return data;
}

function toast(message, type = 'info', timeout = 4200) {
  const stack = $('#toasts');
  const icon = type === 'success' ? '✓' : type === 'error' ? '!' : '⌁';
  const element = document.createElement('div');
  element.className = `toast is-${type}`;
  element.innerHTML = `<span class="toast-icon">${icon}</span><span>${esc(message)}</span>`;
  stack.appendChild(element);
  setTimeout(() => {
    element.classList.add('is-out');
    setTimeout(() => element.remove(), 260);
  }, timeout);
}

async function copyText(text, label = 'Copied to clipboard') {
  if (!text) {
    toast('Nothing to copy yet', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(label, 'success');
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      toast(label, 'success');
    } catch {
      toast('Copy failed — select the text manually', 'error');
    }
    area.remove();
  }
}

async function runAction(button, task) {
  if (state.busy) return;
  state.busy = true;
  if (button) {
    button.disabled = true;
    button.dataset.wasDisabled = 'true';
  }
  try {
    await task();
  } catch (error) {
    console.error(error);
    toast(error.message || 'Something went wrong', 'error', 6200);
  } finally {
    state.busy = false;
    if (button && button.isConnected) {
      button.disabled = false;
      delete button.dataset.wasDisabled;
    }
  }
}

/* ==========================================================================
   shell
   ========================================================================== */

function projectSummaryFromProject(project) {
  return {
    id: project.id,
    title: project.title,
    audience: project.audience,
    audienceLabel: project.audienceMeta?.shortLabel ?? project.audience,
    dishName: project.dish?.name ?? null,
    dishEmoji: project.dish?.emoji ?? null,
    status: project.status,
    stageCount: project.storyboard?.totalStages ?? project.dish?.stages?.length ?? 0,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
    accent: project.dish?.accent ?? project.audienceMeta?.palette?.[0] ?? '#e0a458',
  };
}

function rememberProject(project) {
  const summary = projectSummaryFromProject(project);
  const existing = state.projects.findIndex((item) => item.id === summary.id);
  if (existing >= 0) state.projects[existing] = summary;
  else state.projects.unshift(summary);
  state.projects.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function forgetProject(id) {
  state.projects = state.projects.filter((item) => item.id !== id);
}

function setProject(project) {
  state.project = project;
  if (project) rememberProject(project);
  renderShell();
}

function renderShell() {
  renderSteps();
  renderLibrary();
  renderStatusChips();
  renderCrumbs();
  renderTopbarActions();
}

function renderSteps() {
  const project = state.project;
  const availability = {
    audience: true,
    ideas: Boolean(project),
    breakdown: Boolean(project?.dish),
    storyboard: Boolean(project?.storyboard),
    production: Boolean(project?.storyboard),
  };
  const done = {
    audience: Boolean(project),
    ideas: Boolean(project?.dish),
    breakdown: Boolean(project?.storyboard),
    storyboard: Boolean(project?.storyboard),
    production: state.routeSection === 'production',
  };
  const activeSection = state.routeSection;

  $('#stepNav').innerHTML = STEPS.map((step) => {
    const isActive =
      activeSection === step.section ||
      (step.section === 'audience' && activeSection === 'audience');
    const classes = [
      'step-item',
      isActive ? 'is-active' : '',
      done[step.section] && !isActive ? 'is-done' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `
      <button class="${classes}" type="button"
        data-action="goto-step" data-step="${step.section}"
        ${availability[step.section] ? '' : 'disabled'}
        ${isActive ? 'aria-current="step"' : ''}>
        <span class="step-num${String(step.id).length > 1 ? ' is-compact' : ''}">${
          done[step.section] && !isActive ? '✓' : step.id
        }</span>
        <span class="step-text">
          <span>${step.label}</span>
          <small>${step.hint}</small>
        </span>
      </button>`;
  }).join('');
}

function renderLibrary() {
  $('#libraryCount').textContent = String(state.projects.length);
  const list = $('#libraryList');
  if (!state.projects.length) {
    list.innerHTML = '<p class="library-empty">No films yet. Start with an audience.</p>';
    return;
  }
  list.innerHTML = state.projects
    .map((project) => {
      const isCurrent = state.project?.id === project.id;
      const subtitle = project.dishName
        ? `${project.audienceLabel} · ${project.dishName}`
        : `${project.audienceLabel} · ${project.status}`;
      return `
        <div class="library-item ${isCurrent ? 'is-current' : ''}"
          ${isCurrent ? 'aria-current="true"' : ''}>
          <button class="library-body" type="button" data-action="open-project" data-id="${esc(project.id)}"
            style="all:unset;display:flex;gap:10px;align-items:center;flex:1;min-width:0;cursor:pointer">
            <span class="library-swatch" style="--swatch:${esc(project.accent)}"></span>
            <span class="library-info">
              <strong>${esc(project.title)}</strong>
              <small>${esc(subtitle)}</small>
            </span>
          </button>
          <span class="chip chip-muted" style="font-size:10.5px">${esc(shortDate(project.updatedAt))}</span>
          <button class="library-delete" type="button" title="Delete film"
            data-action="delete-project" data-id="${esc(project.id)}" aria-label="Delete film">✕</button>
        </div>`;
    })
    .join('');
}

function renderStatusChips() {
  const ai = state.ai;
  const render = state.render;
  const flow = state.flow;
  const aiChip = $('#aiChip');
  aiChip.classList.toggle('is-off', !ai?.configured);
  $('.status-label', aiChip).textContent = ai?.configured
    ? `AI planner: ${ai.model}`
    : 'AI: local prompt engine';
  const renderChip = $('#renderChip');
  renderChip.classList.toggle('is-off', !render?.configured);
  $('.status-label', renderChip).textContent = render?.configured
    ? 'Render bridge: connected'
    : 'Render: pack export mode';
  const flowChip = $('#flowChip');
  if (flowChip) {
    const attention = ['attention', 'awaiting_login', 'error'].includes(flow?.status);
    flowChip.classList.toggle('is-off', !isFlowConnected());
    flowChip.classList.toggle('is-attention', attention);
    flowChip.classList.toggle('is-busy', flow?.status === 'busy');
    $('.status-label', flowChip).textContent = flowStatusLabel(flow);
  }
}

function renderCrumbs() {
  const crumbs = $('#crumbs');
  if (!state.project) {
    crumbs.innerHTML = `<span>VidMo Studio</span><span class="crumb-sep">/</span><strong>New film</strong>`;
    return;
  }
  const section = SECTION_LABELS[state.routeSection] ?? 'Film';
  crumbs.innerHTML = `<span>${esc(state.project.audienceMeta?.shortLabel ?? state.project.audience)}</span>
    <span class="crumb-sep">/</span><strong>${esc(state.project.title)}</strong>
    <span class="crumb-sep">/</span><span>${esc(section)}</span>`;
}

function renderTopbarActions() {
  const actions = $('#topbarActions');
  const project = state.project;
  if (!project?.storyboard) {
    actions.innerHTML = project
      ? `<span class="chip chip-muted">${esc(
          project.dish ? `${project.dish.stages.length} planned stages` : '10 ideas ready',
        )}</span>`
      : '';
    return;
  }
  actions.innerHTML = `
    <span class="chip chip-muted">${plural(project.storyboard.totalStages, 'shot')} · ${runtime(
      project.storyboard.totalDuration,
    )}</span>
    <button class="btn btn-ghost btn-sm" type="button" data-action="open-flow">${esc(
      flowStatusLabel(),
    )}</button>
    <button class="btn btn-ghost btn-sm" type="button" data-action="goto-step" data-step="production">Production pack</button>
    <a class="btn btn-outline btn-sm" href="/api/projects/${esc(project.id)}/export?format=zip">Export ZIP</a>`;
}

function renderView(html, { focus = true, scroll = true } = {}) {
  const view = $('#view');
  view.innerHTML = `<div class="view-enter">${html}</div>`;
  if (focus) view.focus({ preventScroll: true });
  if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderSkeleton() {
  $('#view').innerHTML = `
    <div class="skeleton-stack" aria-busy="true" aria-label="Loading">
      <div class="skeleton" style="height:64px"></div>
      <div class="skeleton" style="height:220px"></div>
      <div class="skeleton" style="height:220px"></div>
      <div class="skeleton" style="height:220px"></div>
    </div>`;
}

/* ==========================================================================
   routing
   ========================================================================== */

function parseRoute() {
  const raw = location.hash.replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] === 'project' && parts[1]) {
    return { name: 'project', id: decodeURIComponent(parts[1]), section: parts[2] ?? null };
  }
  return { name: 'new' };
}

function navigate(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function defaultSection(project) {
  if (project?.storyboard) return 'storyboard';
  if (project?.dish) return 'breakdown';
  return 'ideas';
}

function sectionAllowed(project, section) {
  if (!project) return section === 'audience';
  if (section === 'ideas') return true;
  if (section === 'breakdown') return Boolean(project.dish);
  if (section === 'storyboard' || section === 'production') return Boolean(project.storyboard);
  return section === 'audience';
}

async function route() {
  const parsed = parseRoute();
  if (parsed.name === 'new') {
    state.project = null;
    state.routeSection = 'audience';
    stopGenerationPolling();
    renderShell();
    renderAudienceView();
    syncFlowPolling();
    return;
  }

  if (state.project?.id !== parsed.id) {
    renderSkeleton();
    try {
      const data = await api(`/api/projects/${encodeURIComponent(parsed.id)}`);
      state.project = data.project;
    } catch (error) {
      toast(error.message, 'error');
      location.hash = '#/new';
      return;
    }
  }

  let section = parsed.section ?? defaultSection(state.project);
  if (!sectionAllowed(state.project, section)) section = defaultSection(state.project);
  state.routeSection = section;
  const expectedHash = `#/project/${state.project.id}/${section}`;
  if (location.hash !== expectedHash) {
    history.replaceState(null, '', expectedHash);
  }

  renderShell();

  if (section === 'ideas') renderIdeasView();
  else if (section === 'breakdown') renderBreakdownView();
  else if (section === 'storyboard') renderStoryboardView();
  else if (section === 'production') renderProductionView();
  else renderAudienceView();

  const generation = state.project?.generation;
  state.lastGenerationStatus = generation?.status ?? null;
  state.lastGenerationCount =
    (generation?.summary?.images ?? 0) + (generation?.summary?.clips ?? 0);
  if (isGenerationActive(generation)) startGenerationPolling();
  else stopGenerationPolling();
  syncFlowPolling();
}

/* ==========================================================================
   view: audience
   ========================================================================== */

function audienceCard(audience) {
  return `
    <article class="card audience-card" data-action="select-audience" data-audience="${esc(
      audience.id,
    )}" role="button" tabindex="0" aria-label="Choose ${esc(audience.label)}">
      <div class="audience-art">
        ${audienceArt(audience.id)}
        <span class="audience-option">Option ${esc(audience.option)}</span>
      </div>
      <div class="audience-body">
        <div>
          <span class="region">${esc(audience.region)}</span>
          <h3>${esc(audience.label)}</h3>
        </div>
        <p>${esc(audience.description)}</p>
        <div class="rule-list">
          ${(audience.cardRules ?? [])
            .map(
              (rule) => `
            <div class="rule">
              <span class="rule-icon">${rule.icon}</span>
              <span><strong>${esc(rule.label)}:</strong> ${esc(rule.value)}</span>
            </div>`,
            )
            .join('')}
        </div>
        <div class="audience-cta">
          <span class="chip chip-amber">${esc(audience.tagline)}</span>
          <span class="btn btn-primary btn-sm">Choose this audience →</span>
        </div>
      </div>
    </article>`;
}

function renderAudienceView() {
  const audiences = state.bootstrap?.audiences ?? [];
  const latest = state.projects[0];
  const resume = latest
    ? `
    <div class="card card-pad" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:26px">
      <span class="hero-emoji" style="width:52px;height:52px;font-size:26px">${latest.dishEmoji ?? '🎬'}</span>
      <div style="flex:1;min-width:200px">
        <strong>${esc(latest.title)}</strong>
        <p class="small muted">${esc(latest.audienceLabel)} · ${
          latest.dishName ? esc(latest.dishName) : 'ideas in progress'
        } · updated ${esc(shortDate(latest.updatedAt))}</p>
      </div>
      <button class="btn btn-outline btn-sm" type="button" data-action="open-project" data-id="${esc(
        latest.id,
      )}">Resume film</button>
    </div>`
    : '';

  renderView(`
    <section class="page-head">
      <span class="eyebrow">Step 1 of 5 · audience lock</span>
      <div class="page-head-row">
        <div>
          <h1 class="display">Cook small.<br />Go viral.</h1>
        </div>
      </div>
      <p class="lede">One dish becomes a complete vertical film package: recipe-aware stage plan, extreme-macro image prompts, physically believable motion prompts and a strict ASMR-only audio policy. First, lock the world your film lives in.</p>
    </section>

    ${resume}

    <div class="hero-panel">
      <div class="hero-copy">
        <div class="hero-points">
          <span class="chip chip-amber">Extreme macro</span>
          <span class="chip chip-sage">Auto stage count</span>
          <span class="chip chip-teal">ASMR locked</span>
          <span class="chip chip-chili">Consistent scale</span>
        </div>
        <p class="lede">The audience choice locks environment, hands, cookware, lighting and cultural detail for every single stage. Nothing drifts between shots.</p>
      </div>
      <aside class="card hero-aside">
        <span class="eyebrow">Pipeline</span>
        ${[
          ['1', 'Audience', 'Culture, hands and environment'],
          ['2·3', 'Dish choice', '10 curated options or your own'],
          ['4', 'Stage plan', 'Stage count follows real complexity'],
          ['5', 'Storyboard', 'Image + motion + audio prompts'],
          ['5+', 'Production pack', 'Exports and render handoff'],
        ]
          .map(
            ([badge, title, hint]) => `
          <div class="aside-step">
            <span class="aside-num${badge.length > 1 ? ' is-compact' : ''}">${badge}</span>
            <span><strong>${title}</strong><small>${hint}</small></span>
          </div>`,
          )
          .join('')}
      </aside>
    </div>

    <div class="audience-grid">
      ${audiences.map(audienceCard).join('')}
    </div>

    <p class="small faint" style="margin-top:18px">Selecting an audience creates a new film project. You can switch later by starting another film — each project keeps its own locked continuity.</p>
  `);
}

/* ==========================================================================
   view: ideas
   ========================================================================== */

function renderIdeasView() {
  const project = state.project;
  const audience = project.audienceMeta;
  const ideas = project.ideas ?? [];
  const filtered =
    state.ideasFilter === 'all' ? ideas : ideas.filter((idea) => idea.complexity === state.ideasFilter);

  const filters = [
    ['all', 'All'],
    ['simple', 'Simple · 3–5'],
    ['medium', 'Medium · 5–8'],
    ['complex', 'Complex · 8–12'],
  ];

  renderView(`
    <section class="page-head">
      <span class="eyebrow">Steps 2 &amp; 3 · choose your dish</span>
      <div class="page-head-row">
        <div>
          <h1>10 dishes for ${esc(audience?.label ?? project.audience)}</h1>
          <p class="lede" style="margin-top:10px">Every idea is matched to the ${esc(
            audience?.shortLabel ?? '',
          )} continuity: ${esc(audience?.environmentShort ?? '')} · ${esc(
            audience?.handsShort ?? '',
          )}. Pick one below, or direct your own dish at the bottom.</p>
        </div>
        <div class="filter-row">
          ${filters
            .map(
              ([value, label]) => `
            <button class="chip chip-btn ${state.ideasFilter === value ? 'is-active' : ''}"
              type="button" data-action="filter-ideas" data-filter="${value}">${label}</button>`,
            )
            .join('')}
          <button class="btn btn-outline btn-sm" type="button" data-action="surprise-dish">🎲 Surprise me</button>
        </div>
      </div>
    </section>

    <div class="dish-grid">
      ${
        filtered.length
          ? filtered
              .map((idea) => {
                const index = ideas.indexOf(idea);
                return `
        <article class="card dish-card">
          ${dishTile(idea, index)}
          <div class="dish-body">
            <div class="dish-title-row">
              <h3>${esc(idea.name)}</h3>
              <span class="dish-cuisine">${esc(idea.cuisine)}</span>
            </div>
            <p class="dish-tagline">${esc(idea.tagline)}</p>
            <div class="dish-meta">
              <span class="chip ${COMPLEXITY_CHIP[idea.complexity] ?? 'chip-muted'}">${esc(
                idea.complexityLabel ?? idea.complexity,
              )}</span>
              <span class="chip chip-muted">${plural(idea.stageCount, 'stage')}</span>
              <span class="chip chip-muted">~${runtime(idea.estimatedDuration)}</span>
            </div>
            <p class="dish-ingredients">Key ingredients: ${esc(idea.keyIngredients.join(' · '))}</p>
            <div class="dish-actions">
              <button class="btn btn-primary btn-sm" type="button"
                data-action="select-dish" data-dish="${esc(idea.id)}">Select this dish</button>
            </div>
          </div>
        </article>`;
              })
              .join('')
          : `<div class="card empty-state" style="grid-column:1/-1">
              <span class="empty-icon">🍽️</span>
              <h2>No dishes in this filter</h2>
              <p>Try another complexity band, or build a custom dish below.</p>
            </div>`
      }
    </div>

    <section class="section">
      <div class="section-head">
        <div>
          <h2>Or direct your own dish</h2>
          <p>Enter any dish and VidMo will analyze its real complexity before planning the stages.</p>
        </div>
        <span class="chip chip-muted">Stage count is never forced to 5</span>
      </div>
      <div class="card custom-panel">
        <div class="custom-form">
          <div class="field">
            <label for="customName">Dish name</label>
            <input class="input" id="customName" type="text" maxlength="120"
              placeholder="e.g. Chicken Biryani, Lamb Karahi, Smash Burger"
              value="${esc(state.customDraft.name ?? '')}" />
          </div>
          <div class="field">
            <label for="customIngredients">Known ingredients <span class="hint">(optional, comma separated)</span></label>
            <textarea class="textarea" id="customIngredients" maxlength="600"
              placeholder="rice, chicken, saffron, yogurt">${esc(
                state.customDraft.ingredients ?? '',
              )}</textarea>
            <span class="hint">More ingredients means more accurate prompts. Leave empty and VidMo will stay generic.</span>
          </div>
          <label class="checkbox-row">
            <input type="checkbox" id="useAi" ${state.ai?.configured ? '' : 'disabled'}
              ${state.ai?.configured ? 'checked' : ''} />
            <span>${
              state.ai?.configured
                ? `Use the connected AI recipe planner (${esc(state.ai.model)}) for this custom dish`
                : 'AI recipe planner is not configured — the local analyzer will plan it. Set OPENAI_API_KEY to enable.'
            }</span>
          </label>
          <div>
            <button class="btn btn-primary" type="button" data-action="select-custom">Analyze &amp; plan this film</button>
          </div>
        </div>
        <div class="analysis-preview" id="customPreview">
          <span class="eyebrow">Auto analysis</span>
          <div class="analysis-big" id="customPreviewBig">Waiting for a dish name</div>
          <p class="small muted" id="customPreviewText">Type at least three characters and VidMo will classify the recipe complexity, then choose a stage count inside the correct range.</p>
        </div>
      </div>
    </section>
  `);

  updateCustomPreview(state.customAnalysis);
}

function updateCustomPreview(analysis) {
  const big = $('#customPreviewBig');
  const text = $('#customPreviewText');
  const box = $('#customPreview');
  if (!big || !text || !box) return;
  if (!analysis) {
    big.textContent = 'Waiting for a dish name';
    text.textContent =
      'Type at least three characters and VidMo will classify the recipe complexity, then choose a stage count inside the correct range.';
    box.classList.remove('is-ready');
    return;
  }
  big.innerHTML = `${esc(analysis.complexityLabel)} · ${plural(analysis.stageCount, 'stage')}`;
  text.textContent = `${analysis.rationale}. Estimated runtime ~${runtime(
    analysis.estimatedDuration ?? analysis.stageCount * 5,
  )}.`;
  box.classList.add('is-ready');
}

function scheduleAnalyze() {
  clearTimeout(state.customAnalysisTimer);
  const name = ($('#customName')?.value ?? '').trim();
  state.customDraft = {
    name,
    ingredients: $('#customIngredients')?.value ?? '',
  };
  saveJson('vidmo.customDraft', state.customDraft);
  const token = ++state.analysisToken;
  if (name.length < 3) {
    state.customAnalysis = null;
    updateCustomPreview(null);
    return;
  }
  state.customAnalysisTimer = setTimeout(async () => {
    try {
      const data = await api('/api/analyze', {
        method: 'POST',
        body: { name, ingredients: state.customDraft.ingredients, audience: state.project.audience },
      });
      if (token !== state.analysisToken) return;
      state.customAnalysis = data.analysis;
      updateCustomPreview(data.analysis);
    } catch (error) {
      if (token !== state.analysisToken) return;
      console.warn(error);
    }
  }, 450);
}

/* ==========================================================================
   view: breakdown
   ========================================================================== */

function renderBreakdownView() {
  const project = state.project;
  const dish = project.dish;
  const analysis = project.analysis ?? {};
  const marker = { simple: 16, medium: 50, complex: 84 }[dish.complexity] ?? 50;
  const palette = dish.palette ?? project.audienceMeta?.palette ?? [];

  renderView(`
    <section class="page-head">
      <span class="eyebrow">Step 4 · recipe analysis</span>
      <div class="page-head-row">
        <div>
          <h1>Stage breakdown</h1>
          <p class="lede" style="margin-top:10px">Complexity decided the stage count automatically. Simple dishes get 3–5 stages, medium 5–8, complex 8–12. This recipe planned <strong>${plural(
            dish.stages.length,
            'stage',
          )}</strong>.</p>
        </div>
        <div class="filter-row">
          <button class="btn btn-ghost btn-sm" type="button" data-action="goto-step" data-step="ideas">← Change dish</button>
          <button class="btn btn-primary" type="button" data-action="generate-storyboard">Build the storyboard →</button>
        </div>
      </div>
    </section>

    <article class="card dish-hero">
      <div class="dish-hero-main">
        <div class="dish-hero-title">
          <span class="hero-emoji">${esc(dish.emoji ?? '🍽️')}</span>
          <div>
            <h2 style="font-size:30px">${esc(dish.name)}</h2>
            <span class="dish-cuisine">${esc(dish.cuisine)}</span>
          </div>
        </div>
        <p class="lede">${esc(dish.blurb ?? dish.tagline)}</p>
        <div class="dish-meta">
          <span class="chip ${COMPLEXITY_CHIP[dish.complexity] ?? 'chip-muted'}">${esc(
            analysis.complexityLabel ?? dish.complexity,
          )}</span>
          <span class="chip chip-muted">${plural(dish.stages.length, 'stage')}</span>
          <span class="chip chip-muted">~${runtime(
            analysis.estimatedDuration ?? dish.stages.length * 5,
          )}</span>
          <span class="chip chip-muted">${esc(analysis.source === 'ai' ? 'AI planned' : analysis.source === 'custom' ? 'Custom analyzed' : 'Library plan')}</span>
        </div>
        ${
          project.planningNote
            ? `<p class="small muted">${esc(project.planningNote)}</p>`
            : ''
        }
      </div>
      <div class="dish-hero-side">
        <div class="stat-row"><span>Complexity</span><strong>${esc(
          analysis.complexityLabel ?? dish.complexity,
        )}</strong></div>
        <div class="stat-row"><span>Stages</span><strong>${dish.stages.length}</strong></div>
        <div class="stat-row"><span>Est. runtime</span><strong>${runtime(
          analysis.estimatedDuration ?? dish.stages.length * 5,
        )}</strong></div>
        <div class="stat-row"><span>Aspect</span><strong>9:16</strong></div>
        <div class="stat-row"><span>Audio</span><strong>ASMR only</strong></div>
        <div class="complexity-meter">
          <div class="meter-track"><span class="meter-marker" style="left:${marker}%"></span></div>
          <div class="meter-labels"><span>Simple</span><span>Medium</span><span>Complex</span></div>
        </div>
        <p class="small faint">${esc(analysis.rationale ?? '')}</p>
      </div>
    </article>

    <section class="section">
      <div class="section-head">
        <h2>Stage timeline</h2>
        <p>Each stage becomes one locked image + motion + audio shot.</p>
      </div>
      <div class="timeline">
        ${dish.stages
          .map(
            (stage, index) => `
          <div class="timeline-item">
            <span class="timeline-dot">${String(index + 1).padStart(2, '0')}</span>
            <div class="timeline-body">
              <h4>${esc(stage.name)}</h4>
              <p>${esc(stage.visual)}</p>
              <div class="timeline-meta">
                <span class="chip chip-muted">${stage.duration ?? 5}s</span>
                <span class="chip chip-muted">${esc(stage.camera)}</span>
                <span class="chip chip-muted">${esc(
                  (stage.ingredients ?? '').split(',').slice(0, 3).join(' · '),
                )}</span>
              </div>
            </div>
          </div>`,
          )
          .join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Continuity preview</h2>
        <p>Locked before a single prompt is written.</p>
      </div>
      <div class="continuity-strip">
        <div class="lock-chip"><small>Environment</small><strong>${esc(
          project.audienceMeta?.environmentShort ?? '',
        )}</strong></div>
        <div class="lock-chip"><small>Hands</small><strong>${esc(
          project.audienceMeta?.handsShort ?? '',
        )}</strong></div>
        <div class="lock-chip"><small>Cookware</small><strong>${esc(
          (dish.cookware ?? []).slice(0, 3).join(' · '),
        )}</strong></div>
        <div class="lock-chip"><small>Palette</small><strong>${esc(
          palette.join(' · '),
        )}</strong></div>
        <div class="lock-chip"><small>Audio</small><strong>ASMR only — no music, no voice</strong></div>
      </div>
    </section>
  `);
}

/* ==========================================================================
   view: storyboard
   ========================================================================== */

function complianceStrip(stage) {
  const compliance = stage.compliance ?? { score: 100, missing: [] };
  const chips = [`<span class="compliance-chip">${compliance.score}% locked</span>`];
  for (const item of (compliance.missing ?? []).slice(0, 5)) {
    chips.push(`<span class="compliance-chip is-missing">${esc(item)}</span>`);
  }
  return `<div class="compliance-strip">${chips.join('')}</div>`;
}

function promptBlock(stage, index, kind) {
  const meta = PROMPT_META[kind];
  const key = `${index}:${kind}`;
  const expanded = Boolean(state.expanded[key]);
  const editing = state.editing && state.editing.stage === index && state.editing.kind === kind;
  const text = stage[meta.field] ?? '';

  if (editing) {
    return `
      <div class="prompt-block">
        <div class="prompt-head">
          <span class="prompt-label" style="--label-color:${meta.color}">${meta.icon} ${meta.label} · editing</span>
        </div>
        <textarea class="prompt-textarea" id="stageEditor" data-stage="${index}" data-kind="${kind}"
          spellcheck="false">${esc(state.editing.value ?? text)}</textarea>
        <div class="prompt-edit-actions">
          <button class="btn btn-primary btn-sm" type="button" data-action="save-stage" data-stage="${index}" data-kind="${kind}">Save changes</button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="cancel-edit">Cancel</button>
          <span class="small faint" style="margin-left:auto;align-self:center">Saving re-checks the creative locks.</span>
        </div>
      </div>`;
  }

  return `
    <div class="prompt-block">
      <div class="prompt-head">
        <span class="prompt-label" style="--label-color:${meta.color}">${meta.icon} ${meta.label}</span>
        <span class="spacer"></span>
        <div class="prompt-actions">
          <button class="btn btn-ghost btn-sm" type="button" data-action="toggle-expand" data-stage="${index}" data-kind="${kind}">${expanded ? 'Collapse' : 'Expand'}</button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="edit-stage" data-stage="${index}" data-kind="${kind}">Edit</button>
          <button class="btn btn-outline btn-sm" type="button" data-action="copy-prompt" data-stage="${index}" data-kind="${kind}">Copy</button>
        </div>
      </div>
      <pre class="prompt-text ${expanded ? '' : 'is-collapsed'}">${esc(text)}</pre>
    </div>`;
}

function flowPanelHtml(project) {
  const flow = state.flow;
  const generation = project.generation;
  const stages = project.storyboard.stages;
  const summary = generationSummary(generation);
  const active = isGenerationActive(generation);
  const connected = isFlowConnected();
  const allApproved =
    stages.length > 0 && stages.every((stage) => Boolean(stageGeneration(stage.id)?.approvedImageId));
  const total = generation?.total ?? stages.length;
  const done = (generation?.completed ?? 0) + (generation?.failed ?? 0);
  const progress = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const tone =
    flow?.status === 'attention' || flow?.status === 'error' || flow?.status === 'awaiting_login'
      ? 'is-attention'
      : isFlowConnected()
        ? 'is-ready'
        : 'is-off';
  const modeLabel =
    flow?.mode === 'stub'
      ? 'Simulator'
      : flow?.configured
        ? flow?.browser || 'Visible Chrome'
        : 'Setup required';
  const canStart = connected && !active;

  if (!flow) {
    return `<article class="card flow-panel is-off" id="flowPanel">
      <div class="flow-head">
        <div class="flow-title"><span class="flow-orb"></span><div><h3>Google Flow generation</h3><p>Flow status is unavailable. Reload the studio.</p></div></div>
      </div>
    </article>`;
  }

  return `
    <article class="card flow-panel ${tone}" id="flowPanel">
      <div class="flow-head">
        <div class="flow-title">
          <span class="flow-orb"></span>
          <div>
            <h3>Google Flow generation</h3>
            <p>${esc(flow.message || 'Connect your own Flow account to generate stage images and clips.')}</p>
          </div>
        </div>
        <div class="flow-head-actions">
          <span class="flow-mode">${esc(modeLabel)}</span>
          <button class="btn btn-ghost btn-sm" type="button" data-action="open-flow">Flow settings</button>
        </div>
      </div>

      <div class="flow-stats">
        <div class="flow-stat"><small>Stage images</small><strong>${summary.images}</strong><span>${summary.approvedImages}/${stages.length} approved</span></div>
        <div class="flow-stat"><small>Video clips</small><strong>${summary.clips}</strong><span>${summary.approvedClips}/${stages.length} approved</span></div>
        <div class="flow-stat"><small>Flow credits</small><strong>${flow.mode === 'stub' ? '—' : 'Your account'}</strong><span>VidMo never sees the balance</span></div>
      </div>

      ${
        flow.mode === 'stub'
          ? `<div class="flow-banner"><span>◈</span><div><strong>Simulator mode</strong><p>These are placeholder files, not real Flow generations. Set <span class="mono">VIDMO_FLOW_MODE</span> to <span class="mono">browser</span> to use your account.</p></div></div>`
          : !flow.configured
            ? `<div class="flow-banner is-warning"><span>!</span><div><strong>Optional browser driver missing</strong><p>${esc(flow.installNote || 'Run npm install playwright-core, then reconnect.')}</p></div></div>`
            : flow.status === 'attention'
              ? `<div class="flow-banner is-warning"><span>!</span><div><strong>Flow needs you</strong><p>${esc(flow.attention || flow.message)}</p><div class="flow-inline-actions"><button class="btn btn-primary btn-sm" type="button" data-action="resume-flow">Resume</button><button class="btn btn-ghost btn-sm" type="button" data-action="focus-flow">Open Flow window</button></div></div></div>`
              : ''
      }

      ${
        generation
          ? `<div class="flow-progress" role="status" aria-live="polite">
              <div class="flow-progress-top">
                <span>${esc(generation.message || 'Ready')}</span>
                <strong>${done}/${total}</strong>
              </div>
              <div class="flow-track"><span class="flow-bar" style="width:${progress}%"></span></div>
              <div class="flow-progress-foot">
                <span>${esc(
                  generation.status === 'queued'
                    ? 'Queued'
                    : generation.status === 'running'
                      ? 'Flow handles one shot at a time'
                      : generation.status === 'attention'
                        ? 'Waiting for you'
                        : generation.status === 'cancelling'
                          ? 'Cancelling'
                          : `${generation.status}${generation.finishedAt ? ` · ${assetAge(generation.finishedAt)}` : ''}`,
                )}</span>
                ${active ? '<button class="btn btn-ghost btn-sm" type="button" data-action="cancel-generation">Cancel</button>' : ''}
              </div>
            </div>`
          : ''
      }

      ${
        generation?.errors?.length
          ? `<div class="flow-errors">${generation.errors
              .slice(0, 3)
              .map((error) => `<span>${esc(error.stageId ? `${error.stageId}: ` : '')}${esc(error.message)}</span>`)
              .join('')}</div>`
          : ''
      }

      <div class="flow-stage-map">
        ${stages
          .map((stage, index) => {
            const stageState = stageGeneration(stage.id);
            const hasImage = Boolean(stageState?.images?.length);
            const approved = Boolean(stageState?.approvedImageId);
            const hasClip = Boolean(stageState?.clips?.length);
            const stateClass = approved ? 'is-approved' : hasImage ? 'is-draft' : '';
            return `<button class="flow-stage-pill ${stateClass}" type="button" data-action="scroll-stage" data-stage="${index}">
              <span>${esc(stage.id)}</span>
              <small>${hasImage ? (approved ? 'image ✓' : 'image') : 'image —'}${hasClip ? ' · clip' : ''}</small>
            </button>`;
          })
          .join('')}
      </div>

      <div class="flow-actions">
        ${
          !connected
            ? `<button class="btn btn-primary btn-sm" type="button" data-action="open-flow">Connect Google Flow</button>`
            : `<button class="btn btn-primary btn-sm" type="button" data-action="generate-images" ${canStart ? '' : 'disabled'}>Generate all images</button>
               <button class="btn btn-outline btn-sm" type="button" data-action="approve-images" ${canStart && summary.images > summary.approvedImages ? '' : 'disabled'}>Approve all current images</button>
               <button class="btn btn-primary btn-sm" type="button" data-action="generate-clips" ${canStart && allApproved ? '' : 'disabled'} title="${allApproved ? 'Generate one clip per approved image' : 'Approve one image for every stage first'}">Generate all clips</button>`
        }
        <a class="btn btn-outline btn-sm" href="/api/projects/${esc(project.id)}/export?format=flow">Flow pack</a>
        <button class="btn btn-ghost btn-sm" type="button" data-action="focus-flow" ${flow.connected ? '' : 'disabled'}>Open Flow window</button>
      </div>
      <p class="flow-note">Images first, then image-to-video. Flow uses your own account: images currently cost 0 credits, while video needs Flow credits — an active Google AI Pro/Ultra plan is required for clips. VidMo never stores your Google password, cookies or session tokens. <a href="https://flow.google.com/" target="_blank" rel="noreferrer">Open Flow</a></p>
    </article>`;
}

function assetHistoryHtml(stage, index, images, approvedId) {
  if (!images || images.length < 2) return '';
  return `<div class="asset-history">
    <small>Earlier takes · click to approve</small>
    <div class="asset-history-row">
      ${images
        .slice(0, -1)
        .reverse()
        .map(
          (asset) => `<button class="asset-thumb ${asset.id === approvedId ? 'is-approved' : ''}" type="button"
            data-action="approve-asset" data-stage="${index}" data-asset-id="${esc(asset.id)}"
            title="Use this take as the approved stage image">
            <img src="${mediaUrl(state.project.id, stage.id, asset.file)}" alt="Earlier stage image" loading="lazy" />
            <span>${asset.id === approvedId ? '✓' : ''}</span>
          </button>`,
        )
        .join('')}
    </div>
  </div>`;
}

function assetPanel(stage, index) {
  const generation = stageGeneration(stage.id);
  const images = generation?.images ?? [];
  const clips = generation?.clips ?? [];
  const image = selectedImage(stage.id);
  const clip = selectedClip(stage.id);
  const imageApproved = Boolean(
    image && (image.id === generation?.approvedImageId || image.approved),
  );
  const connected = isFlowConnected();
  const active = isGenerationActive();
  const canGenerate = connected && !active;
  const projectId = state.project.id;
  const poster = image ? mediaUrl(projectId, stage.id, image.file) : '';
  const clipReady = Boolean(generation?.approvedImageId);
  const staleImage = image?.promptStale;
  const staleClip = clip?.promptStale;
  const imageSource = image?.source === 'simulator' ? 'Simulator' : image?.source === 'upload' ? 'Uploaded' : 'Flow';
  const clipSource = clip?.source === 'simulator' ? 'Simulator' : clip?.source === 'upload' ? 'Uploaded' : 'Flow';

  return `
    <div class="asset-panel">
      <div class="asset-head">
        <div>
          <span class="asset-eyebrow">Flow assets</span>
          <strong>${images.length ? `${plural(images.length, 'image take')} · ` : ''}${clips.length ? `${plural(clips.length, 'clip')}` : 'No clips yet'}</strong>
        </div>
        <span class="asset-gate ${clipReady ? 'is-ready' : ''}">${clipReady ? '✓ image approved' : 'approve image to unlock video'}</span>
      </div>

      <div class="asset-grid">
        <div class="asset-card">
          <div class="asset-preview ${image ? 'has-media' : ''}">
            ${
              image
                ? `<img src="${poster}" alt="${esc(stage.name)} stage image" loading="lazy" />`
                : `<span class="asset-placeholder-icon">◉</span><span class="asset-placeholder-text">Stage image</span>`
            }
            <span class="asset-kind">IMAGE</span>
            ${imageApproved ? '<span class="asset-approved">✓ approved</span>' : ''}
            ${staleImage ? '<span class="asset-stale">prompt changed</span>' : ''}
          </div>
          <div class="asset-meta">
            <div class="asset-meta-row">
              <strong>${image ? 'Stage image' : 'No stage image yet'}</strong>
              <small>${image ? `${esc(imageSource)}${image.model ? ` · ${esc(image.model)}` : ''}${image.bytes ? ` · ${formatBytes(image.bytes)}` : ''}${image.createdAt ? ` · ${assetAge(image.createdAt)}` : ''}` : 'Generate in Flow or upload a download.'}</small>
            </div>
            <div class="asset-actions">
              ${
                image
                  ? `<button class="btn btn-primary btn-sm" type="button" data-action="approve-asset" data-stage="${index}" data-asset-id="${esc(image.id)}" ${imageApproved ? 'disabled' : ''}>${imageApproved ? 'Approved' : 'Approve image'}</button>`
                  : ''
              }
              <button class="btn btn-outline btn-sm" type="button" data-action="generate-stage-image" data-stage="${index}" ${canGenerate ? '' : 'disabled'}>${image ? 'Reroll image' : 'Generate image'}</button>
              <button class="btn btn-ghost btn-sm" type="button" data-action="pick-asset" data-stage="${index}" data-kind="image">Upload</button>
              ${image ? `<a class="btn btn-ghost btn-sm" href="${mediaUrl(projectId, stage.id, image.file, { download: true })}">Download</a><button class="btn btn-ghost btn-sm is-danger-text" type="button" data-action="delete-asset" data-stage="${index}" data-asset-id="${esc(image.id)}" data-kind="image">Remove</button>` : ''}
            </div>
            <input type="file" hidden data-action="import-file" data-stage="${index}" data-kind="image" accept="image/png,image/jpeg,image/webp" />
          </div>
          ${image && staleImage ? '<p class="asset-warning">The prompt changed after this take. Reroll to match the current storyboard.</p>' : ''}
          ${assetHistoryHtml(stage, index, images, generation?.approvedImageId)}
        </div>

        <div class="asset-card">
          <div class="asset-preview asset-video ${clip ? 'has-media' : ''}">
            ${
              clip?.stub
                ? `<div class="asset-stub-video" ${poster ? `style="background-image:url('${poster}')"` : ''}><span>▶</span><small>Simulated clip</small></div>`
                : clip
                  ? `<video controls preload="metadata" ${poster ? `poster="${poster}"` : ''} src="${mediaUrl(projectId, stage.id, clip.file)}"></video>`
                  : `<span class="asset-placeholder-icon">▶</span><span class="asset-placeholder-text">Image-to-video clip</span>`
            }
            <span class="asset-kind">CLIP</span>
            ${clip ? '<span class="asset-approved">✓ ready</span>' : ''}
            ${staleClip ? '<span class="asset-stale">prompt changed</span>' : ''}
          </div>
          <div class="asset-meta">
            <div class="asset-meta-row">
              <strong>${clip ? 'Generated clip' : 'No clip yet'}</strong>
              <small>${clip ? `${esc(clipSource)}${clip.bytes ? ` · ${formatBytes(clip.bytes)}` : ''}${clip.createdAt ? ` · ${assetAge(clip.createdAt)}` : ''}` : clipReady ? 'The approved image is ready as the start frame.' : 'Approve a stage image first.'}</small>
            </div>
            <div class="asset-actions">
              <button class="btn btn-outline btn-sm" type="button" data-action="generate-stage-clip" data-stage="${index}" ${canGenerate && clipReady ? '' : 'disabled'}>${clip ? 'Reroll clip' : 'Generate clip'}</button>
              <button class="btn btn-ghost btn-sm" type="button" data-action="pick-asset" data-stage="${index}" data-kind="clip">Upload</button>
              ${clip ? `<a class="btn btn-ghost btn-sm" href="${mediaUrl(projectId, stage.id, clip.file, { download: true })}">Download</a><button class="btn btn-ghost btn-sm is-danger-text" type="button" data-action="delete-asset" data-stage="${index}" data-asset-id="${esc(clip.id)}" data-kind="clip">Remove</button>` : ''}
            </div>
            <input type="file" hidden data-action="import-file" data-stage="${index}" data-kind="clip" accept="video/mp4,video/webm,video/quicktime" />
          </div>
          ${clip && staleClip ? '<p class="asset-warning">The motion prompt changed after this clip. Reroll to match the current storyboard.</p>' : ''}
          ${clip?.warnings?.length ? `<p class="asset-warning">${esc(clip.warnings[0])}</p>` : ''}
          ${!clipReady ? '<p class="asset-hint">Generate the image, review continuity, then approve it. The clip button unlocks after approval.</p>' : ''}
        </div>
      </div>
    </div>`;
}

function stageRailImage(stage) {
  const image = selectedImage(stage.id);
  if (!image) return null;
  const approved = Boolean(
    image.approved || image.id === stageGeneration(stage.id)?.approvedImageId,
  );
  return `<div class="frame-tile has-photo">
    <img class="stage-photo" src="${mediaUrl(state.project.id, stage.id, image.file)}" alt="${esc(stage.name)} generated stage image" loading="lazy" />
    <span class="frame-badge">${esc(stage.id)}</span>
    <span class="stage-photo-badge ${approved ? 'is-approved' : ''}">${approved ? '✓ approved' : 'draft'}</span>
  </div>`;
}
function stageCard(stage, index, palette) {
  const negative = state.expanded[`${index}:negative`];
  const clip = selectedClip(stage.id);
  return `
    <article class="card stage-card" id="stage-${index}">
      <div class="stage-rail">
        ${stageRailImage(stage) ?? stageFrame(stage, index, palette)}
        <div class="stage-rail-meta">
          <span>🎥 ${esc(stage.camera)}</span>
          <span>⏱ ${stage.duration ?? 5}s clip · 9:16</span>
          <span>🧂 ${esc((stage.ingredients ?? '').split(',').slice(0, 2).join(', '))}</span>
          ${clip ? '<span class="rail-clip">🎞 clip ready</span>' : ''}
        </div>
      </div>
      <div class="stage-main">
        <div class="stage-top">
          <div class="stage-title">
            <h3>${esc(stage.id)} · ${esc(stage.name)}</h3>
            <p>${esc(stage.visual)}</p>
          </div>
          <div class="stage-controls">
            ${complianceStrip(stage)}
            <button class="btn btn-ghost btn-sm" type="button" data-action="copy-stage" data-stage="${index}">Copy stage</button>
            <button class="btn btn-outline btn-sm" type="button" data-action="reroll-stage" data-stage="${index}">Reroll prompts</button>
          </div>
        </div>
        ${assetPanel(stage, index)}
        ${promptBlock(stage, index, 'image')}
        ${promptBlock(stage, index, 'motion')}
        ${promptBlock(stage, index, 'audio')}
        <details class="negative-details" ${negative ? 'open' : ''}>
          <summary>Negative prompt — keep the model away from these</summary>
          <pre class="prompt-text">${esc(stage.negativePrompt ?? '')}</pre>
        </details>
      </div>
    </article>`;
}

function stageMarkdown(stage, index) {
  return `### STAGE ${index + 1} — ${stage.name}

IMAGE PROMPT:
${stage.imagePrompt}

MOTION PROMPT:
${stage.motionPrompt}

AUDIO PROMPT:
${stage.audioPrompt}

NEGATIVE PROMPT:
${stage.negativePrompt}`;
}

function renderStoryboardView({ preserveScroll = false } = {}) {
  const project = state.project;
  const storyboard = project.storyboard;
  const palette = project.dish.palette ?? project.audienceMeta?.palette ?? [];
  const audit = storyboard.audit ?? { passed: true, score: 100, checks: [] };
  const failing = (audit.checks ?? []).filter((check) => !check.pass);
  const failingDetail = (check) => {
    if (check.id === 'all-stage-locks' && Array.isArray(audit.stages)) {
      return audit.stages
        .map((stageAudit, index) => ({ stageAudit, index }))
        .filter(({ stageAudit }) => !stageAudit.passed)
        .map(({ stageAudit, index }) =>
          `Stage ${index + 1} missing: ${(stageAudit.missing ?? []).join(', ')}`)
        .join(' · ');
    }
    return '';
  };
  const failingLines = failing
    .map((check) => failingDetail(check) || check.label)
    .join(' · ');

  renderView(`
    <section class="page-head">
      <span class="eyebrow">Step 5 · locked storyboard</span>
      <div class="page-head-row">
        <div>
          <h1>${esc(project.dish.name)}</h1>
          <p class="lede" style="margin-top:10px">${esc(storyboard.audience)} · ${plural(
            storyboard.totalStages,
            'stage',
          )} · ${runtime(storyboard.totalDuration)} · ${esc(storyboard.aspect)} · every shot keeps the same scale, hands, light and sound.</p>
        </div>
        <div class="filter-row">
          <a class="btn btn-outline btn-sm" href="/api/projects/${esc(project.id)}/export?format=md">Download briefing</a>
          <button class="btn btn-primary btn-sm" type="button" data-action="goto-step" data-step="production">Build production pack →</button>
        </div>
      </div>
    </section>

    <article class="card storyboard-head">
      <div class="storyboard-summary">
        <div class="summary-stats">
          <div class="stat"><small>Stages</small><strong>${storyboard.totalStages}</strong></div>
          <div class="stat"><small>Runtime</small><strong>${runtime(storyboard.totalDuration)}</strong></div>
          <div class="stat"><small>Scale</small><strong>1:12</strong></div>
          <div class="stat"><small>Aspect</small><strong>9:16</strong></div>
          <div class="stat"><small>Audio</small><strong>ASMR</strong></div>
        </div>
        <div class="lock-chip">
          <small>Shot formula</small>
          <strong>Image prompt → motion prompt → ASMR audio prompt, per stage</strong>
        </div>
      </div>
      <div class="audit-wrap">
        <div class="audit-ring" style="--score:${audit.score};--ring-color:${
          audit.passed ? 'var(--green)' : 'var(--amber)'
        }">
          <span class="audit-ring-value"><strong>${audit.score}</strong><small>lock score</small></span>
        </div>
        <div class="audit-text">
          <h3>${audit.passed ? 'All locks engaged' : 'Locks need attention'}</h3>
          <p>${
            audit.passed
              ? 'Every stage carries macro, scale, continuity and ASMR-only requirements.'
              : 'Some prompts were edited away from the production rules. Review the flagged stages below.'
          }</p>
        </div>
      </div>
    </article>

    ${
      failing.length
        ? `<div class="audit-banner is-warning">
            <span class="audit-banner-icon">!</span>
            <div>
              <strong>${plural(failing.length, 'check')} failing</strong>
              <p>${esc(failingLines)}</p>
            </div>
          </div>`
        : `<div class="audit-banner">
            <span class="audit-banner-icon">✓</span>
            <div>
              <strong>Production-ready prompt set</strong>
              <p>Stage range, progression, final hero shot and the no-music audio policy all passed.</p>
            </div>
          </div>`
    }

    ${flowPanelHtml(project)}

    <div class="continuity-strip">
      <div class="lock-chip"><small>Scale</small><strong>${esc(storyboard.summary.scale)}</strong></div>
      <div class="lock-chip"><small>Hands</small><strong>${esc(storyboard.summary.hands)}</strong></div>
      <div class="lock-chip"><small>Environment</small><strong>${esc(
        storyboard.summary.environment,
      )}</strong></div>
      <div class="lock-chip"><small>Palette</small><strong>${esc(
        storyboard.summary.palette,
      )}</strong></div>
      <div class="lock-chip"><small>Sound</small><strong>${esc(storyboard.summary.audio)}</strong></div>
    </div>

    <div class="stage-list">
      ${storyboard.stages.map((stage, index) => stageCard(stage, index, palette)).join('')}
    </div>
  `, { focus: !preserveScroll, scroll: !preserveScroll });
}

/* ==========================================================================
   view: production
   ========================================================================== */

function socialSnippet(label, text, type) {
  return `
    <div class="social-snippet">
      <header>
        <small>${esc(label)}</small>
        <button class="btn btn-ghost btn-sm" type="button" data-action="copy-text" data-copy="${esc(
          text,
        )}">Copy</button>
      </header>
      <p>${esc(text)}</p>
    </div>`;
}

function renderProductionView() {
  const project = state.project;
  const storyboard = project.storyboard;
  const social = storyboard.social;
  const production = storyboard.production;
  const audit = storyboard.audit ?? { checks: [] };
  const jobs = project.render?.jobs ?? [];
  const render = state.render;
  const flowSummary = generationSummary(project.generation);
  const flowStages = storyboard.stages.filter(
    (stage) => (stageGeneration(stage.id)?.images?.length ?? 0) > 0,
  ).length;
  const flowClips = storyboard.stages.filter(
    (stage) => (stageGeneration(stage.id)?.clips?.length ?? 0) > 0,
  ).length;

  renderView(`
    <section class="page-head">
      <span class="eyebrow">Production pack</span>
      <div class="page-head-row">
        <div>
          <h1>${esc(project.dish.name)} — handoff</h1>
          <p class="lede" style="margin-top:10px">Everything a renderer or editor needs: Markdown briefing, shot-list CSV, machine-readable JSON, model handoff and a ZIP pack with per-stage prompt files.</p>
        </div>
        <div class="filter-row">
          <button class="btn btn-ghost btn-sm" type="button" data-action="new-film">＋ New film</button>
          <button class="btn btn-outline btn-sm" type="button" data-action="goto-step" data-step="storyboard">← Back to storyboard</button>
        </div>
      </div>
    </section>

    <div class="production-grid">
      <article class="card export-card">
        <h3>Download artifacts</h3>
        <p>Choose a format. The ZIP pack contains every stage prompt plus any Flow-generated images and clips, and a ready-to-open Flow board.</p>
        <div class="export-list">
          <a class="download-link" href="/api/projects/${esc(project.id)}/export?format=zip">
            <span class="dl-icon">⤓</span>
            <span><strong>Full production pack (.zip)</strong><small>README · manifest · prompts · media · Flow board</small></span>
          </a>
          <a class="download-link" href="/api/projects/${esc(project.id)}/export?format=flow">
            <span class="dl-icon">◈</span>
            <span><strong>Google Flow pack (.zip)</strong><small>Flow board · image + video prompts · approved media</small></span>
          </a>
          <a class="download-link" href="/api/projects/${esc(project.id)}/export?format=md">
            <span class="dl-icon">≡</span>
            <span><strong>Director briefing (.md)</strong><small>Continuity bible + full storyboard</small></span>
          </a>
          <a class="download-link" href="/api/projects/${esc(project.id)}/export?format=csv">
            <span class="dl-icon">▦</span>
            <span><strong>Shot list (.csv)</strong><small>Spreadsheet-ready with all prompts</small></span>
          </a>
          <a class="download-link" href="/api/projects/${esc(project.id)}/export?format=json">
            <span class="dl-icon">{ }</span>
            <span><strong>Project JSON</strong><small>Automation-ready production schema</small></span>
          </a>
          <a class="download-link" href="/api/projects/${esc(project.id)}/export?format=handoff">
            <span class="dl-icon">↗</span>
            <span><strong>Render handoff</strong><small>Model-agnostic job manifest</small></span>
          </a>
        </div>
      </article>

      <article class="card export-card">
        <h3>Google Flow media</h3>
        <p>Generated and imported stage media stays local. Approve images on the storyboard before animating them with Flow.</p>
        <div class="production-flow-stats">
          <div class="flow-stat"><small>Images</small><strong>${flowSummary.images}</strong><span>${flowStages}/${storyboard.totalStages} stages covered</span></div>
          <div class="flow-stat"><small>Clips</small><strong>${flowSummary.clips}</strong><span>${flowClips}/${storyboard.totalStages} stages covered</span></div>
          <div class="flow-stat"><small>Approved</small><strong>${flowSummary.approvedImages}</strong><span>images ready for video</span></div>
        </div>
        <div class="flow-actions" style="margin-top:14px">
          <button class="btn btn-outline btn-sm" type="button" data-action="goto-step" data-step="storyboard">Review Flow assets</button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="open-flow">${esc(flowStatusLabel())}</button>
          <a class="btn btn-ghost btn-sm" href="/api/projects/${esc(project.id)}/export?format=flow">Download Flow pack</a>
        </div>
        <p class="small faint">Flow generation uses your own account and credits. The pack is the stable fallback if Flow’s UI changes.</p>
      </article>

      <article class="card export-card">
        <h3>Render bridge</h3>
        <p>${esc(render?.note ?? '')}</p>
        ${
          render?.configured
            ? `<button class="btn btn-primary" type="button" data-action="queue-render">Queue ${plural(
                storyboard.totalStages,
                'shot',
              )} to renderer</button>`
            : `<div class="code-note">VIDMO_RENDER_WEBHOOK=https://your-renderer.example/api/jobs
VIDMO_RENDER_WEBHOOK_TOKEN=optional-bearer-token
VIDMO_PUBLIC_URL=http://127.0.0.1:4173
VIDMO_RENDER_CALLBACK_SECRET=optional-callback-secret</div>`
        }
        ${
          jobs.length
            ? `<div class="render-status">
                <span class="chip chip-muted">Status: ${esc(project.render?.status ?? 'queued')}</span>
                ${jobs
                  .slice(0, 8)
                  .map(
                    (job) => `
                  <span class="render-job">
                    <span class="status-dot" style="background:${
                      job.status === 'complete' ? 'var(--green)' : 'var(--amber)'
                    }"></span>
                    ${esc(job.stageId)} · ${esc(job.status)}${job.videoUrl ? ' · ready' : ''}
                  </span>`,
                  )
                  .join('')}
              </div>`
            : ''
        }
        <p class="small faint">The bridge sends the full render-handoff manifest. Callbacks update stage status via <span class="mono">/api/render/callback</span>.</p>
      </article>

      <article class="card export-card">
        <h3>Quality audit</h3>
        <p>Creative-lock checks that ran over the entire storyboard.</p>
        <div class="checklist">
          ${(audit.checks ?? [])
            .map(
              (check) => `
            <div class="check-item ${check.pass ? '' : 'is-fail'}">
              <span class="check-icon">${check.pass ? '✓' : '!'}</span>
              <span>${esc(check.label)}</span>
            </div>`,
            )
            .join('')}
        </div>
      </article>

      <article class="card export-card">
        <h3>Publishing checklist</h3>
        <p>Keep the miniature film feeling like one production, not unrelated clips.</p>
        <div class="checklist">
          ${(production.checklist ?? [])
            .map(
              (item) => `
            <div class="check-item">
              <span class="check-icon">✓</span>
              <span>${esc(item)}</span>
            </div>`,
            )
            .join('')}
        </div>
      </article>
    </div>

    <section class="section">
      <div class="section-head">
        <div>
          <h2>Video model handoff</h2>
          <p>Pick the model you plan to render with, then follow its note for every stage.</p>
        </div>
        <label class="field" style="min-width:220px">
          <span class="small muted">Default model</span>
          <select class="select" id="defaultModel">
            ${(state.settings?.videoModels ?? [])
              .map(
                (model) =>
                  `<option value="${esc(model)}" ${
                    model === state.settings?.defaultVideoModel ? 'selected' : ''
                  }>${esc(model)}</option>`,
              )
              .join('')}
          </select>
        </label>
      </div>
      <div class="production-grid">
        ${(production.videoModels ?? [])
          .map(
            (model) => `
          <article class="card model-card">
            <div class="dish-title-row">
              <h3>${esc(model.name)}</h3>
              <span class="chip ${model.name === state.settings?.defaultVideoModel ? 'chip-amber' : 'chip-muted'}">${esc(
                model.clip,
              )}</span>
            </div>
            <span class="tag">${esc(model.mode)}</span>
            <p class="model-note">${esc(model.note)}</p>
          </article>`,
          )
          .join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <h2>Social copy pack</h2>
          <p>Titles, hooks, captions and hashtags tuned for short-form placement.</p>
        </div>
      </div>
      <div class="production-grid">
        <article class="card social-card">
          <h3>Hook &amp; caption</h3>
          ${socialSnippet('Hook overlay', social.hooks[0], 'hook')}
          ${socialSnippet('Caption', social.caption, 'caption')}
          ${socialSnippet('Hashtags', social.hashtags, 'hashtags')}
        </article>
        <article class="card social-card">
          <h3>Title options</h3>
          ${social.titles
            .map((title, index) => socialSnippet(`Title ${index + 1}`, title, 'title'))
            .join('')}
        </article>
        <article class="card social-card">
          <h3>Platform copy</h3>
          ${socialSnippet('YouTube Shorts', social.platforms.youtubeShorts, 'shorts')}
          ${socialSnippet('TikTok', social.platforms.tiktok, 'tiktok')}
          ${socialSnippet('Instagram Reels', social.platforms.instagramReels, 'reels')}
          ${socialSnippet('Facebook Reels', social.platforms.facebookReels, 'facebook')}
        </article>
        <article class="card social-card">
          <h3>Thumbnail prompt</h3>
          <div class="social-snippet">
            <header>
              <small>Cover frame · 9:16</small>
              <button class="btn btn-ghost btn-sm" type="button" data-action="copy-text" data-copy="${esc(
                storyboard.thumbnailPrompt,
              )}">Copy</button>
            </header>
            <p>${esc(storyboard.thumbnailPrompt)}</p>
          </div>
          <div class="social-snippet">
            <header>
              <small>Global negative prompt</small>
              <button class="btn btn-ghost btn-sm" type="button" data-action="copy-text" data-copy="${esc(
                storyboard.negativePrompt,
              )}">Copy</button>
            </header>
            <p>${esc(storyboard.negativePrompt)}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Danger zone</h2>
        <p>Deleting a film removes its storyboard, prompts and render status from this studio.</p>
      </div>
      <button class="btn btn-danger" type="button" data-action="delete-project" data-id="${esc(
        project.id,
      )}">Delete this film</button>
    </section>
  `);
}

/* ==========================================================================
   modals
   ========================================================================== */

function closeModal() {
  state.modal = null;
  const root = $('#modalRoot');
  root.hidden = true;
  root.innerHTML = '';
  document.body.style.overflow = '';
  syncFlowPolling();
}

function openModal(html, { onOpen, type = 'generic' } = {}) {
  const root = $('#modalRoot');
  state.modal = type;
  root.hidden = false;
  root.innerHTML = `<div class="modal-scrim" data-action="close-modal"></div>${html}`;
  document.body.style.overflow = 'hidden';
  if (onOpen) onOpen(root);
}

function openSettingsModal() {
  const ai = state.ai;
  const render = state.render;
  openModal(`
    <section class="modal-card" role="dialog" aria-modal="true" aria-label="Studio settings">
      <header class="modal-head">
        <h2>Studio settings</h2>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close settings">✕</button>
      </header>
      <div class="modal-body">
        <div class="modal-section">
          <h3>AI recipe planner</h3>
          <div class="kv"><span>Status</span><strong>${ai?.configured ? 'Connected' : 'Local engine'}</strong></div>
          <div class="kv"><span>Model</span><strong>${esc(ai?.model ?? '—')}</strong></div>
          <div class="kv"><span>Endpoint</span><strong>${esc(ai?.baseUrlHost ?? '—')}</strong></div>
          <p class="small muted">${esc(ai?.note ?? '')}</p>
          <div class="code-note">OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini</div>
          <p class="small faint">The AI planner only designs custom recipe stages. Image, motion and audio prompts always stay locked by the local prompt engine, so mandatory rules cannot be dropped.</p>
        </div>

        <div class="modal-section">
          <h3>Render bridge</h3>
          <div class="kv"><span>Status</span><strong>${render?.configured ? 'Connected' : 'Export mode'}</strong></div>
          ${render?.webhookHost ? `<div class="kv"><span>Webhook</span><strong>${esc(render.webhookHost)}</strong></div>` : ''}
          <p class="small muted">${esc(render?.note ?? '')}</p>
          <div class="code-note">VIDMO_RENDER_WEBHOOK=https://your-renderer.example/api/jobs
VIDMO_RENDER_WEBHOOK_TOKEN=optional-bearer-token
VIDMO_PUBLIC_URL=http://127.0.0.1:4173
VIDMO_RENDER_CALLBACK_SECRET=optional-callback-secret</div>
        </div>

        <div class="modal-section">
          <h3>Defaults</h3>
          <label class="field">
            <span class="small muted">Default video model</span>
            <select class="select" id="modalDefaultModel">
              ${(state.settings?.videoModels ?? [])
                .map(
                  (model) =>
                    `<option value="${esc(model)}" ${
                      model === state.settings?.defaultVideoModel ? 'selected' : ''
                    }>${esc(model)}</option>`,
                )
                .join('')}
            </select>
          </label>
        </div>

        <div class="modal-section">
          <h3>Data &amp; privacy</h3>
          <p class="small muted">Projects are stored locally in <span class="mono">data/store.json</span>. API keys are read from environment variables only and are never returned to the browser.</p>
          <div class="kv"><span>Audio policy</span><strong>ASMR only · no music · no voice</strong></div>
          <div class="kv"><span>Export formats</span><strong>MD · CSV · JSON · ZIP · handoff</strong></div>
        </div>
      </div>
    </section>
  `);
}

function flowModalHtml() {
  const flow = state.flow;
  const diagnostics = state.flowDiagnostics;
  const connected = isFlowConnected();
  const mode = flow?.mode === 'stub' ? 'Simulator' : 'Your Google account';
  const windowLabel =
    flow?.mode === 'stub'
      ? 'None — local simulator'
      : flow?.launchMode === 'attach'
        ? 'Your Chrome (attached)'
        : 'VidMo-managed Chrome';
  const status = flow?.status ?? 'disconnected';

  return `
    <section class="modal-card flow-modal-card" role="dialog" aria-modal="true" aria-label="Google Flow connection">
      <header class="modal-head">
        <div>
          <span class="eyebrow">Generation engine</span>
          <h2>Google Flow</h2>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close Flow settings">✕</button>
      </header>
      <div class="modal-body">
        <div class="flow-modal-status is-${esc(status)}">
          <span class="status-dot"></span>
          <div>
            <strong>${esc(flowStatusLabel(flow))}</strong>
            <p>${esc(flow?.message ?? 'Connect Flow to generate stage images and clips.')}</p>
          </div>
          ${flow?.mode === 'stub' ? '<span class="chip chip-amber">Simulator</span>' : ''}
        </div>

        <div class="flow-kv-grid">
          <div class="kv"><span>Engine</span><strong>${esc(mode)}</strong></div>
          <div class="kv"><span>Browser</span><strong>${esc(flow?.browser || (flow?.mode === 'stub' ? 'None — local simulator' : 'Chrome / Edge'))}</strong></div>
          <div class="kv"><span>Window</span><strong>${esc(windowLabel)}</strong></div>
          <div class="kv"><span>Local profile</span><strong class="mono">${esc(flow?.profile || 'data/flow-profile')}</strong></div>
          <div class="kv"><span>Credits</span><strong>Your Flow account</strong></div>
        </div>

        ${
          flow?.mode === 'stub'
            ? `<div class="modal-section">
                <h3>Simulator mode</h3>
                <p class="small muted">The built-in simulator creates placeholder images and clips without opening Flow or spending credits. It is useful for testing the pipeline. To use your own account, restart VidMo with <span class="mono">VIDMO_FLOW_MODE=browser</span>.</p>
                <div class="code-note">set VIDMO_FLOW_MODE=browser
npm install playwright-core
npm start</div>
              </div>`
            : ``
        }

        ${
          flow && !flow.configured
            ? `<div class="modal-section">
                <h3>Install the browser driver</h3>
                <p class="small muted">Flow is a signed-in web app, so VidMo needs the optional Playwright driver to open a visible Chrome window. The core studio still works without it, and the Flow pack export remains available.</p>
                <div class="code-note">npm install playwright-core
npm start</div>
                <p class="small faint">${esc(flow.installNote || '')}</p>
              </div>`
            : ``
        }

        ${
          flow?.mode !== 'stub' && !connected
            ? `<div class="modal-section">
                <h3>Connect your own account</h3>
                <ol class="flow-steps">
                  <li>VidMo opens a visible Chrome window with a dedicated local profile.</li>
                  <li>Sign in to Google Flow yourself in that window. Use a personal account with Flow access and a stable connection; VidMo never sees the password.</li>
                  <li>Return here. VidMo detects sign-in automatically; then generate images first and clips second. Images currently cost 0 credits; video clips need Flow credits from an AI Pro/Ultra plan.</li>
                </ol>
                <label class="consent-row">
                  <input type="checkbox" id="flowConsent" ${state.flowConsent ? 'checked' : ''} />
                  <span>I understand that VidMo will automate clicks in my signed-in Flow session, and that paid generations spend Flow credits from my own Google account.</span>
                </label>
                <div class="flow-actions">
                  <button class="btn btn-primary" type="button" data-action="connect-flow" ${state.flowConsent ? '' : 'disabled'}>Open Flow in Chrome</button>
                  <a class="btn btn-ghost" href="https://flow.google.com/" target="_blank" rel="noreferrer">Open Flow in my browser</a>
                </div>
                <p class="small faint">No iframe, OAuth shortcut or credential storage. Flow has no public API, so this is a real browser session under your control.</p>
              </div>`
            : ``
        }

        ${
          connected && flow?.mode !== 'stub'
            ? `<div class="modal-section">
                <h3>Session controls</h3>
                <p class="small muted">${esc(flow?.message || 'Flow is ready.')}</p>
                <div class="flow-actions">
                  <button class="btn btn-outline btn-sm" type="button" data-action="focus-flow">Bring Flow to front</button>
                  ${
                    flow?.status === 'attention'
                      ? '<button class="btn btn-primary btn-sm" type="button" data-action="resume-flow">Resume generation</button>'
                      : '<button class="btn btn-ghost btn-sm" type="button" data-action="pause-flow">Pause</button>'
                  }
                  <button class="btn btn-ghost btn-sm" type="button" data-action="capture-flow">Capture diagnostics</button>
                  <button class="btn btn-ghost btn-sm" type="button" data-action="disconnect-flow">Disconnect</button>
                  <button class="btn btn-ghost btn-sm is-danger-text" type="button" data-action="clear-flow-profile">Clear local profile</button>
                </div>
                <p class="small faint">The profile is <span class="mono">${esc(flow?.profile ?? 'data/flow-profile')}</span>. It stays on this computer. Disconnecting closes the window; clearing also removes the local Google session for this profile.</p>
              </div>

              <div class="modal-section">
                <h3>What VidMo can automate</h3>
                <div class="flow-capabilities">
                  <span>Image model + 9:16</span>
                  <span>Locked image prompt</span>
                  <span>Image approval gate</span>
                  <span>Video / Frames</span>
                  <span>Start-frame upload</span>
                  <span>Captions off · ASMR lock</span>
                </div>
                <p class="small muted">Flow’s UI is not a public API. If it changes, VidMo pauses on captcha/credits/terms, saves a screenshot, and lets you capture selectors for repair. Nothing is bypassed.</p>
              </div>`
            : ``
        }

        ${
          flow?.screenshotUrl
            ? `<div class="modal-section">
                <h3>Latest Flow screenshot</h3>
                <a class="flow-shot-link" href="${esc(flow.screenshotUrl)}" target="_blank" rel="noreferrer">
                  <img class="flow-shot" src="${esc(flow.screenshotUrl)}" alt="Latest Google Flow browser screenshot" />
                </a>
                <p class="small faint">Captured locally on this machine. It may contain your Flow project names and media.</p>
              </div>`
            : ``
        }

        ${
          diagnostics
            ? `<div class="modal-section">
                <h3>Diagnostics</h3>
                <p class="small muted">Saved at <span class="mono">${esc(diagnostics.file ?? 'data/flow/diagnostics')}</span> · ${diagnostics.visibleElements ?? 0} visible controls · ${esc(diagnostics.savedAt ?? '')}</p>
                ${
                  diagnostics.screenshotUrl
                    ? `<a class="btn btn-ghost btn-sm" href="${esc(diagnostics.screenshotUrl)}" target="_blank" rel="noreferrer">Open screenshot</a>`
                    : ''
                }
                <div class="diag-list">
                  ${(diagnostics.elements ?? [])
                    .slice(0, 12)
                    .map(
                      (element) =>
                        `<span><strong>${esc(element.tag)}</strong>${element.role ? ` · ${esc(element.role)}` : ''} · ${esc(element.name || '(no label)')}</span>`,
                    )
                    .join('')}
                </div>
                <p class="small faint">If a selector fails, this JSON + ARIA snapshot is what to inspect or attach to a bug report. Prompts and page text stay local.</p>
              </div>`
            : ``
        }

        <div class="modal-section">
          <h3>Privacy &amp; terms</h3>
          <p class="small muted">VidMo does not ask for, proxy or store Google credentials. You sign in directly in Google’s page. The local browser profile and generated media live under <span class="mono">data/</span>. Flow usage is subject to Google’s terms and credit pricing; VidMo is not affiliated with Google.</p>
          <div class="kv"><span>Audio lock</span><strong>ASMR only · no music · no voice</strong></div>
          <div class="kv"><span>Image gate</span><strong>Approve before image-to-video</strong></div>
        </div>
      </div>
    </section>`;
}

function flowSignature(flow = state.flow, diagnostics = state.flowDiagnostics) {
  return JSON.stringify([
    flow?.mode,
    flow?.status,
    flow?.message,
    flow?.configured,
    flow?.installNote,
    flow?.connected,
    flow?.attention,
    flow?.paused,
    flow?.screenshotUrl,
    flow?.browser,
    flow?.launchMode,
    flow?.profile,
    flow?.url,
    flow?.lastError,
    diagnostics?.savedAt ?? null,
  ]);
}

function openFlowModal() {
  state.flowSignature = flowSignature();
  openModal(flowModalHtml(), { type: 'flow' });
  syncFlowPolling();
}

function refreshFlowModal() {
  if (state.modal !== 'flow') return;
  const root = $('#modalRoot');
  if (!root || root.hidden) return;
  const signature = flowSignature();
  // Re-rendering restarts the modal entry animation, so only refresh when the
  // Flow state actually changed.
  if (signature === state.flowSignature) return;
  state.flowSignature = signature;
  const body = $('.modal-body', root);
  const scroll = body?.scrollTop ?? 0;
  root.innerHTML = `<div class="modal-scrim" data-action="close-modal"></div>${flowModalHtml()}`;
  const nextBody = $('.modal-body', root);
  if (nextBody) nextBody.scrollTop = scroll;
}


function openDeleteModal(id) {
  const project = state.projects.find((item) => item.id === id);
  openModal(`
    <section class="modal-card" role="dialog" aria-modal="true" aria-label="Delete film">
      <header class="modal-head">
        <h2>Delete this film?</h2>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close">✕</button>
      </header>
      <div class="modal-body">
        <p class="lede">“${esc(project?.title ?? 'This film')}” and its full storyboard will be removed from the studio. This cannot be undone.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-danger" type="button" data-action="confirm-delete" data-id="${esc(
            id,
          )}">Delete film</button>
          <button class="btn btn-outline" type="button" data-action="close-modal">Keep it</button>
        </div>
      </div>
    </section>
  `);
}

/* ==========================================================================
   actions
   ========================================================================== */

async function createProject(audienceId) {
  const data = await api('/api/projects', { method: 'POST', body: { audience: audienceId } });
  setProject(data.project);
  toast(`New ${data.project.audienceMeta.shortLabel} film — 10 dish ideas ready`, 'success');
  navigate(`#/project/${data.project.id}/ideas`);
}

async function selectDish(dishId) {
  const project = state.project;
  const data = await api(`/api/projects/${project.id}/select`, {
    method: 'POST',
    body: { dishId },
  });
  setProject(data.project);
  toast(`${data.project.dish.name} planned — ${plural(data.project.dish.stages.length, 'stage')}`, 'success');
  navigate(`#/project/${project.id}/breakdown`);
}

async function selectCustomDish() {
  const project = state.project;
  const name = ($('#customName')?.value ?? '').trim();
  if (!name) {
    toast('Enter a custom dish name first', 'error');
    return;
  }
  const ingredients = $('#customIngredients')?.value ?? '';
  const useAi = Boolean($('#useAi')?.checked);
  state.customDraft = { name, ingredients };
  saveJson('vidmo.customDraft', state.customDraft);

  const data = await api(`/api/projects/${project.id}/select`, {
    method: 'POST',
    body: { dishId: 'custom', customDish: { name, ingredients }, useAi },
  });
  setProject(data.project);
  toast(
    `${data.project.dish.name} analyzed — ${data.project.analysis.complexityLabel}, ${plural(
      data.project.dish.stages.length,
      'stage',
    )}`,
    'success',
  );
  navigate(`#/project/${project.id}/breakdown`);
}

async function generateStoryboard() {
  const project = state.project;
  const data = await api(`/api/projects/${project.id}/storyboard`, { method: 'POST', body: {} });
  setProject(data.project);
  toast(
    `Storyboard ready — ${plural(data.project.storyboard.totalStages, 'locked shot')}`,
    'success',
  );
  navigate(`#/project/${project.id}/storyboard`);
}

async function rerollStage(index) {
  const project = state.project;
  const data = await api(`/api/projects/${project.id}/stage/${index + 1}/reroll`, {
    method: 'POST',
    body: {},
  });
  setProject(data.project);
  toast(`Stage ${index + 1} prompts rerolled — locks verified`, 'success');
  renderStoryboardView();
}

async function saveStageEdit(index, kindElement) {
  const project = state.project;
  const kind = kindElement.dataset.kind;
  const meta = PROMPT_META[kind];
  const editor = $('#stageEditor');
  const value = editor ? editor.value : '';
  const data = await api(`/api/projects/${project.id}/stage/${index + 1}`, {
    method: 'PATCH',
    body: { [meta.field]: value },
  });
  state.editing = null;
  setProject(data.project);
  const stage = data.project.storyboard.stages[index];
  const score = stage.compliance?.score ?? 100;
  toast(
    score === 100 ? 'Prompt saved — all locks intact' : `Prompt saved — lock score ${score}%`,
    score === 100 ? 'success' : 'info',
  );
  renderStoryboardView();
}

async function queueRender() {
  const project = state.project;
  const data = await api(`/api/projects/${project.id}/render`, { method: 'POST', body: {} });
  setProject(data.project);
  toast(`Queued ${plural(data.project.storyboard.totalStages, 'shot')} to the render bridge`, 'success');
  renderProductionView();
}

async function deleteProject(id) {
  await api(`/api/projects/${id}`, { method: 'DELETE' });
  forgetProject(id);
  closeModal();
  if (state.project?.id === id) {
    state.project = null;
    toast('Film deleted', 'info');
    navigate('#/new');
  } else {
    toast('Film deleted', 'info');
    renderShell();
  }
}

async function startGeneration(kind, { stageIds = [], autoApprove = false, confirmation } = {}) {
  const project = state.project;
  if (!project) return;
  if (confirmation && !window.confirm(confirmation)) return;
  const data = await api(`/api/projects/${project.id}/generate/${kind}`, {
    method: 'POST',
    body: { stageIds, autoApprove },
  });
  state.project = data.project;
  rememberProject(data.project);
  state.lastGenerationStatus = data.generation?.status ?? null;
  state.lastGenerationCount = -1;
  renderShell();
  if (state.routeSection === 'storyboard') renderStoryboardView({ preserveScroll: true });
  else if (state.routeSection === 'production') renderProductionView();
  startGenerationPolling();
  syncFlowPolling();
  toast(
    kind === 'images'
      ? `Flow queued ${plural(stageIds.length || project.storyboard.totalStages, 'stage image')}`
      : `Flow queued ${plural(stageIds.length || project.storyboard.totalStages, 'clip')}`,
    'success',
  );
}

async function generateAllImages() {
  const project = state.project;
  const count = project.storyboard.totalStages;
  await startGeneration('images', {
    stageIds: project.storyboard.stages.map((stage) => stage.id),
    autoApprove: false,
    confirmation: `Generate ${plural(count, 'stage image')} in Google Flow? Images currently cost 0 credits and take a few minutes each.`,
  });
}

async function generateAllClips() {
  const project = state.project;
  const approved = project.storyboard.stages.every(
    (stage) => stageGeneration(stage.id)?.approvedImageId,
  );
  if (!approved) {
    toast('Approve one image on every stage before generating clips', 'error');
    return;
  }
  await startGeneration('clips', {
    stageIds: project.storyboard.stages.map((stage) => stage.id),
    confirmation: `Generate ${plural(project.storyboard.totalStages, 'video clip')} in Flow? Each 8s/720p clip costs 12 Flow credits (prices can change) and takes several minutes.`,
  });
}

async function generateStageImage(index) {
  const stage = state.project.storyboard.stages[index];
  await startGeneration('images', {
    stageIds: [stage.id],
    confirmation: `Generate a new image take for ${stage.id} in Google Flow? Images currently cost 0 credits.`,
  });
}

async function generateStageClip(index) {
  const stage = state.project.storyboard.stages[index];
  if (!stageGeneration(stage.id)?.approvedImageId) {
    toast('Approve a stage image first — it becomes the video start frame', 'error');
    return;
  }
  await startGeneration('clips', {
    stageIds: [stage.id],
    confirmation: `Animate ${stage.id} in Google Flow? This spends Flow credits and can take several minutes.`,
  });
}

async function approveAllImages() {
  const data = await api(`/api/projects/${state.project.id}/approve-images`, {
    method: 'POST',
    body: { stageIds: [], approved: true },
  });
  state.project = data.project;
  rememberProject(data.project);
  toast('Latest stage image approved on every stage that has one', 'success');
  renderStoryboardView({ preserveScroll: true });
}

async function approveAsset(index, assetId) {
  const stage = state.project.storyboard.stages[index];
  const data = await api(
    `/api/projects/${state.project.id}/stages/${index + 1}/assets/${encodeURIComponent(assetId)}`,
    { method: 'PATCH', body: { approved: true } },
  );
  state.project = data.project;
  rememberProject(data.project);
  toast(`${stage.id} image approved — clip generation unlocked`, 'success');
  renderStoryboardView({ preserveScroll: true });
}

async function deleteAsset(index, assetId, kind) {
  const stage = state.project.storyboard.stages[index];
  if (!window.confirm(`Remove this ${kind} from ${stage.id}? The local file is deleted too.`)) return;
  const data = await api(
    `/api/projects/${state.project.id}/stages/${index + 1}/assets/${encodeURIComponent(assetId)}`,
    { method: 'DELETE' },
  );
  state.project = data.project;
  rememberProject(data.project);
  toast(`${kind === 'image' ? 'Image' : 'Clip'} removed from ${stage.id}`, 'info');
  renderStoryboardView({ preserveScroll: true });
}

function pickAsset(index, kind) {
  const input = $(
    `input[data-action="import-file"][data-stage="${index}"][data-kind="${kind}"]`,
  );
  if (input) input.click();
}

async function uploadAsset(input) {
  const file = input.files?.[0];
  if (!file) return;
  const index = Number(input.dataset.stage);
  const kind = input.dataset.kind;
  const stage = state.project.storyboard.stages[index];
  if (!stage) return;
  if (!['image', 'clip'].includes(kind)) return;
  const maxBytes = 250 * 1024 * 1024;
  if (file.size > maxBytes) {
    toast('File is larger than the 250 MB upload limit', 'error');
    input.value = '';
    return;
  }
  try {
    const response = await fetch(
      `/api/projects/${state.project.id}/stages/${index + 1}/assets?kind=${kind}&filename=${encodeURIComponent(
        file.name,
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      },
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `Upload failed (${response.status})`);
    state.project = data.project;
    rememberProject(data.project);
    toast(
      kind === 'image'
        ? `${stage.id} image uploaded — approve it after reviewing continuity`
        : `${stage.id} clip uploaded`,
      'success',
    );
    renderStoryboardView({ preserveScroll: true });
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    input.value = '';
  }
}

async function cancelGeneration() {
  const data = await api(`/api/projects/${state.project.id}/generate/cancel`, {
    method: 'POST',
    body: {},
  });
  state.project = data.project;
  rememberProject(data.project);
  toast('Cancelling Flow generation…', 'info');
  renderStoryboardView({ preserveScroll: true });
  startGenerationPolling();
}

function scrollToStage(index) {
  const target = $(`#stage-${index}`);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateFlowPanelDom() {
  const panel = $('#flowPanel');
  if (panel && state.project?.storyboard && state.routeSection === 'storyboard') {
    panel.outerHTML = flowPanelHtml(state.project);
  }
  renderTopbarActions();
}

async function connectFlow() {
  const data = await api('/api/flow/connect', { method: 'POST', body: { consent: true } });
  state.flow = data.flow;
  renderShell();
  refreshFlowModal();
  syncFlowPolling();
  toast(
    state.flow.mode === 'stub'
      ? 'Flow simulator ready'
      : 'Flow window opened — sign in there, VidMo will detect it',
    'success',
  );
}

async function disconnectFlow(clearProfile = false) {
  const data = await api('/api/flow/disconnect', {
    method: 'POST',
    body: { clearProfile },
  });
  state.flow = data.flow;
  renderShell();
  refreshFlowModal();
  syncFlowPolling();
  toast(clearProfile ? 'Flow session cleared' : 'Flow disconnected', 'info');
}

async function clearFlowProfile() {
  if (
    !window.confirm(
      'Clear the local Flow browser profile? This signs the dedicated VidMo Chrome profile out of Google and deletes its cookies.',
    )
  ) {
    return;
  }
  await disconnectFlow(true);
}

async function pauseFlow() {
  const data = await api('/api/flow/pause', {
    method: 'POST',
    body: { reason: 'Paused by you. Resolve anything in the Flow window, then resume.' },
  });
  state.flow = data.flow;
  renderShell();
  refreshFlowModal();
  syncFlowPolling();
}

async function resumeFlow() {
  const data = await api('/api/flow/resume', { method: 'POST', body: {} });
  state.flow = data.flow;
  renderShell();
  refreshFlowModal();
  syncFlowPolling();
  toast('Flow resumed', 'success');
}

async function focusFlow() {
  const data = await api('/api/flow/focus', { method: 'POST', body: {} });
  state.flow = data.flow;
  refreshFlowModal();
}

async function captureFlowDiagnostics() {
  const data = await api('/api/flow/diagnostics', { method: 'POST', body: {} });
  state.flowDiagnostics = data.diagnostics;
  state.flow = data.flow;
  refreshFlowModal();
  toast('Flow diagnostics saved locally', 'success');
}

async function refreshFlowStatus() {
  const data = await api('/api/flow/status');
  state.flow = data.flow;
  renderStatusChips();
  updateFlowPanelDom();
  refreshFlowModal();
  syncFlowPolling();
}

function needsFlowPolling() {
  const status = state.flow?.status;
  return (
    state.modal === 'flow' ||
    ['launching', 'awaiting_login', 'attention', 'busy'].includes(status) ||
    isGenerationActive()
  );
}

function syncFlowPolling() {
  if (needsFlowPolling()) {
    if (!state.flowTimer) {
      state.flowTimer = setInterval(() => {
        refreshFlowStatus().catch(() => {});
      }, 2500);
    }
  } else if (state.flowTimer) {
    clearInterval(state.flowTimer);
    state.flowTimer = null;
  }
}

const TERMINAL_GENERATION_STATUSES = ['complete', 'partial', 'error', 'cancelled', 'interrupted'];

function startGenerationPolling() {
  if (state.generationTimer) return;
  state.generationTimer = setInterval(() => {
    refreshProjectGeneration().catch(() => {});
  }, 1800);
}

function stopGenerationPolling() {
  if (state.generationTimer) clearInterval(state.generationTimer);
  state.generationTimer = null;
}

async function refreshProjectGeneration() {
  if (state.polling || !state.project) return;
  state.polling = true;
  try {
    const data = await api(`/api/projects/${encodeURIComponent(state.project.id)}`);
    const project = data.project;
    if (!project) return;
    const previousStatus = state.lastGenerationStatus;
    const previousCount = state.lastGenerationCount;
    const generation = project.generation;
    const count =
      (generation?.summary?.images ?? 0) + (generation?.summary?.clips ?? 0);
    state.project = project;
    rememberProject(project);

    const status = generation?.status ?? null;
    const changed = count !== previousCount;
    const terminalNow =
      status && TERMINAL_GENERATION_STATUSES.includes(status) && status !== previousStatus;

    if (state.routeSection === 'storyboard') {
      if ((changed || terminalNow) && !state.editing) {
        renderStoryboardView({ preserveScroll: true });
      } else {
        updateFlowPanelDom();
      }
    } else if (state.routeSection === 'production') {
      if (changed || terminalNow) renderProductionView();
    } else {
      updateFlowPanelDom();
    }
    renderStatusChips();

    if (terminalNow) {
      stopGenerationPolling();
      toast(
        generation.message || 'Flow generation finished',
        status === 'complete' ? 'success' : status === 'cancelled' ? 'info' : 'error',
        6500,
      );
    }
    state.lastGenerationStatus = status;
    state.lastGenerationCount = count;
    if (!isGenerationActive(generation)) {
      stopGenerationPolling();
      syncFlowPolling();
    }
  } finally {
    state.polling = false;
  }
}

function resolveCopyText(button) {
  const stageIndex = button.dataset.stage;
  const kind = button.dataset.kind;
  if (stageIndex !== undefined && kind && PROMPT_META[kind]) {
    const stage = state.project?.storyboard?.stages[Number(stageIndex)];
    return stage?.[PROMPT_META[kind].field] ?? '';
  }
  if (stageIndex !== undefined && kind === 'stage') {
    const stage = state.project?.storyboard?.stages[Number(stageIndex)];
    return stage ? stageMarkdown(stage, Number(stageIndex)) : '';
  }
  if (button.dataset.copy) return button.dataset.copy;
  return '';
}

/* ==========================================================================
   event wiring
   ========================================================================== */

document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'toggle-sidebar') {
    document.body.classList.toggle('sidebar-open');
    return;
  }
  if (action === 'new-film') {
    document.body.classList.remove('sidebar-open');
    navigate('#/new');
    return;
  }
  if (action === 'close-modal') {
    closeModal();
    return;
  }
  if (action === 'open-settings') {
    openSettingsModal();
    return;
  }
  if (action === 'goto-step') {
    const step = target.dataset.step;
    document.body.classList.remove('sidebar-open');
    if (step === 'audience') {
      navigate('#/new');
    } else if (step === 'ideas' && state.project) {
      navigate(`#/project/${state.project.id}/ideas`);
    } else if (step === 'breakdown' && state.project) {
      navigate(`#/project/${state.project.id}/breakdown`);
    } else if ((step === 'storyboard' || step === 'production') && state.project) {
      navigate(`#/project/${state.project.id}/${step}`);
    }
    return;
  }
  if (action === 'open-project') {
    const id = target.dataset.id;
    document.body.classList.remove('sidebar-open');
    const project = await api(`/api/projects/${id}`).catch((error) => {
      toast(error.message, 'error');
      return null;
    });
    if (!project) return;
    state.project = project.project;
    navigate(`#/project/${id}/${defaultSection(project.project)}`);
    return;
  }
  if (action === 'delete-project') {
    openDeleteModal(target.dataset.id);
    return;
  }
  if (action === 'confirm-delete') {
    await runAction(target, () => deleteProject(target.dataset.id));
    return;
  }
  if (action === 'select-audience') {
    await runAction(target, () => createProject(target.dataset.audience));
    return;
  }
  if (action === 'filter-ideas') {
    state.ideasFilter = target.dataset.filter;
    renderIdeasView();
    return;
  }
  if (action === 'select-dish') {
    await runAction(target, () => selectDish(target.dataset.dish));
    return;
  }
  if (action === 'surprise-dish') {
    const ideas = state.project?.ideas ?? [];
    if (!ideas.length) return;
    const pick = ideas[Math.floor(Math.random() * ideas.length)];
    toast(`Surprise pick: ${pick.name}`, 'info');
    await runAction(target, () => selectDish(pick.id));
    return;
  }
  if (action === 'select-custom') {
    await runAction(target, () => selectCustomDish());
    return;
  }
  if (action === 'generate-storyboard') {
    await runAction(target, () => generateStoryboard());
    return;
  }
  if (action === 'toggle-expand') {
    const key = `${target.dataset.stage}:${target.dataset.kind}`;
    state.expanded[key] = !state.expanded[key];
    renderStoryboardView();
    return;
  }
  if (action === 'edit-stage') {
    const index = Number(target.dataset.stage);
    const kind = target.dataset.kind;
    const stage = state.project.storyboard.stages[index];
    state.editing = { stage: index, kind, value: stage[PROMPT_META[kind].field] };
    renderStoryboardView();
    const editor = $('#stageEditor');
    if (editor) {
      editor.focus();
      editor.setSelectionRange(editor.value.length, editor.value.length);
    }
    return;
  }
  if (action === 'cancel-edit') {
    state.editing = null;
    renderStoryboardView();
    return;
  }
  if (action === 'save-stage') {
    await runAction(target, () => saveStageEdit(Number(target.dataset.stage), target));
    return;
  }
  if (action === 'reroll-stage') {
    await runAction(target, () => rerollStage(Number(target.dataset.stage)));
    return;
  }
  if (action === 'copy-prompt' || action === 'copy-stage' || action === 'copy-text') {
    const text = resolveCopyText(target);
    await copyText(text);
    return;
  }
  if (action === 'queue-render') {
    await runAction(target, () => queueRender());
    return;
  }
  if (action === 'open-flow') {
    openFlowModal();
    return;
  }
  if (action === 'connect-flow') {
    await runAction(target, () => connectFlow());
    return;
  }
  if (action === 'disconnect-flow') {
    await runAction(target, () => disconnectFlow(false));
    return;
  }
  if (action === 'clear-flow-profile') {
    await runAction(target, () => clearFlowProfile());
    return;
  }
  if (action === 'pause-flow') {
    await runAction(target, () => pauseFlow());
    return;
  }
  if (action === 'resume-flow') {
    await runAction(target, () => resumeFlow());
    return;
  }
  if (action === 'focus-flow') {
    await runAction(target, () => focusFlow());
    return;
  }
  if (action === 'capture-flow') {
    await runAction(target, () => captureFlowDiagnostics());
    return;
  }
  if (action === 'generate-images') {
    await runAction(target, () => generateAllImages());
    return;
  }
  if (action === 'generate-clips') {
    await runAction(target, () => generateAllClips());
    return;
  }
  if (action === 'generate-stage-image') {
    await runAction(target, () => generateStageImage(Number(target.dataset.stage)));
    return;
  }
  if (action === 'generate-stage-clip') {
    await runAction(target, () => generateStageClip(Number(target.dataset.stage)));
    return;
  }
  if (action === 'approve-images') {
    await runAction(target, () => approveAllImages());
    return;
  }
  if (action === 'approve-asset') {
    await runAction(target, () =>
      approveAsset(Number(target.dataset.stage), target.dataset.assetId),
    );
    return;
  }
  if (action === 'delete-asset') {
    await runAction(target, () =>
      deleteAsset(Number(target.dataset.stage), target.dataset.assetId, target.dataset.kind),
    );
    return;
  }
  if (action === 'pick-asset') {
    pickAsset(Number(target.dataset.stage), target.dataset.kind);
    return;
  }
  if (action === 'cancel-generation') {
    await runAction(target, () => cancelGeneration());
    return;
  }
  if (action === 'scroll-stage') {
    scrollToStage(Number(target.dataset.stage));
    return;
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'customName' || event.target.id === 'customIngredients') {
    scheduleAnalyze();
  }
});

document.addEventListener('change', async (event) => {
  const target = event.target;
  if (target.id === 'flowConsent') {
    state.flowConsent = Boolean(target.checked);
    saveJson('vidmo.flowConsent', state.flowConsent);
    const button = $('[data-action="connect-flow"]');
    if (button) button.disabled = !state.flowConsent;
    return;
  }
  if (target.matches('input[data-action="import-file"]')) {
    await uploadAsset(target);
    return;
  }
  if (target.id !== 'defaultModel' && target.id !== 'modalDefaultModel') return;
  try {
    const data = await api('/api/settings', {
      method: 'PATCH',
      body: { defaultVideoModel: target.value },
    });
    state.settings = data.settings;
    toast(`Default video model: ${target.value}`, 'success');
    if (state.routeSection === 'production') renderProductionView();
  } catch (error) {
    toast(error.message, 'error');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (state.modal) closeModal();
    document.body.classList.remove('sidebar-open');
  }
});

window.addEventListener('hashchange', () => {
  route();
});

/* ==========================================================================
   boot
   ========================================================================== */

async function loadBootstrap() {
  const data = await api('/api/bootstrap');
  state.bootstrap = data;
  state.projects = data.projects ?? [];
  state.ai = data.ai;
  state.render = data.render;
  state.flow = data.flow;
  state.settings = data.settings;
}

async function init() {
  $('#brandMark').innerHTML = logoMark();
  try {
    await loadBootstrap();
  } catch (error) {
    $('#view').innerHTML = `
      <div class="card empty-state">
        <span class="empty-icon">!</span>
        <h2>Studio server not reachable</h2>
        <p>${esc(error.message)}</p>
        <p class="small faint">Run <span class="mono">npm start</span> and open the printed local URL.</p>
      </div>`;
    return;
  }
  renderShell();
  await route();
}

init();
