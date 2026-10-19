# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Support for the October 2026 Flow composer** (agent-style workspace):
  ProseMirror prompt, “Start generation”, and the Settings card with
  Image/Video mode, Frames/Ingredients, aspect ratio, model family, output
  count, video resolution and duration. VidMo selects Image → 9:16 → x1 for
  stage images and Video → Frames → 9:16 → 720p → 8s → x1 for clips.
- Chrome attach mode: VidMo now starts a normal visible Chrome (no automation
  flags) with remote debugging bound to `127.0.0.1:9333` and attaches over CDP,
  so Google accepts the interactive sign-in. A Flow window already listening on
  that port is reused. Configurable with `VIDMO_FLOW_CDP` and
  `VIDMO_FLOW_CDP_PORT`.
- `VIDMO_FLOW_SIGNIN_URL` and a deterministic sign-in button that opens
  Google's real account page with `continue=https://flow.google.com/`.
- `VIDMO_FLOW_ALLOW_EXTENSIONS`: the dedicated Flow profile now launches with
  `--disable-extensions` by default because Flow rejects pages modified by
  extensions ("unusual activity").
- `npm run flow:probe`: attach to the open Flow window and print its URL, tabs,
  visible interactive elements and optional screenshot/ARIA snapshot for
  selector maintenance.
- Deterministic detection of Flow's "We noticed some unusual activity" block,
  with a clear failure message instead of waiting for the image timeout.
- Diagnostics capture (screenshot + DOM/ARIA) when the prompt field is missing
  or rejected, the Generate button is missing/disabled, or the Flow composer
  fails to open after creating a project.
- Mock-Flow coverage for the 2026 composer (mode/aspect/count selection,
  "Start generation", settings card close) in `npm run test:flow`.

### Changed

- Flow project creation now waits for either the composer or the New project
  button, uses visible-first selector matching, and reports progress while
  opening/creating the Flow project.
- `findFirst` checks all selectors in short rounds within one deadline, so a
  hidden legacy selector can no longer consume the whole timeout and hide a
  visible modern match.
- Sign-in readiness ignores Flow's marketing pages and nudges signed-in users
  back to the app; the Flow panel/modal only re-renders when its signature
  changes, preventing animation restarts during polling.

### Fixed

- Flow's 9:16 radio is now verified via `aria-checked` and clicked when needed
  (the old code assumed any visible "9:16" label meant the ratio was applied).
- Video mode selects the Frames composer explicitly and falls back through an
  upload menu when the start-frame tile does not open a file chooser directly.
- The Flow panel no longer crashes on a missing stage generation record (TDZ
  shadowing) and no longer loses the selected tab during status polling.
- Image confirmations now state that Flow images currently cost 0 credits, and
  clip confirmations show the observed 12-credit cost for an 8s/720p clip.
  Documentation and in-app copy explain that clips require a Google AI
  Pro/Ultra plan (or purchased Flow credits) and that shared/free accounts are
  frequently blocked by Flow's anti-abuse system.

## [1.1.0] — 2026-10-19

### Added

- **Google Flow generation** (opt-in): connect your own signed-in Flow session
  in a visible Chrome/Edge window (optional `playwright-core` driver), generate
  all stage images from the locked image prompts, approve one take per stage,
  then animate each approved image into an image-to-video clip.
- Per-stage Flow assets panel: previews, approve/reroll, upload your own
  downloads, download, delete, earlier-take history, stale-prompt warnings and
  an image-approval gate that keeps clips locked until an image is approved.
- Flow generation queue with one job at a time, live per-stage progress,
  cancel, pause/resume for captcha/credits/terms/manual steps, credit warnings
  and diagnostics capture (screenshot + DOM/ARIA JSON) that stays local.
- Flow pack export (`format=flow`): openable browser board, per-stage
  image/video prompts, manifest, shot list, import-back instructions and any
  generated media; also embedded in the full ZIP pack.
- Flow simulator mode (`VIDMO_FLOW_MODE=stub`) for testing the entire pipeline
  with placeholder media and no credits, plus a mock-Flow Playwright test suite
  (`npm run test:flow`).
- `npm run flow:discover`: signed-in Flow DOM discovery that suggests
  selectors for `data/flow/selectors.json` overrides.
- Local media store with magic-byte validation, 250 MB upload limit and Range
  streaming (`GET /api/projects/:id/media/:stage/:file`).

### Changed

- Store format v2; existing v1 data remains readable.
- ZIP exports now include generated images and clips when present.
- Store writes retry transient Windows rename locks instead of failing jobs.
- Expected 4xx API errors no longer spam the server console.

## [1.0.0] — 2026-10-19

Initial release.

### Added

- Five-step guided workflow: audience lock → 10 dish ideas → dish choice or
  custom dish → complexity-based stage plan → locked image/motion/audio
  storyboard.
- Two audience continuity bibles (English-Speaking West, India & Pakistan)
  that lock environment, hands, cookware, lighting, palette and ambience for
  every stage.
- 20 hand-authored dishes (10 Western, 10 South Asian) with curated stage
  beats, complexity tiers and runtime estimates.
- Prompt engine that enforces the production locks on every stage:
  extreme macro photography, giant hands vs. tiny food, 1:12 scale
  continuity, and an ASMR-only audio policy (no music, no voiceover).
- Per-stage prompt audits: edits that break a lock are flagged with the exact
  missing requirement, and one click rerolls a stage back to full compliance.
- Custom dish analysis using a deterministic local planner, with an optional
  OpenAI-compatible AI planner that only proposes recipe stages — the locked
  prompt engine always writes the final prompts.
- Exports: director briefing (Markdown), shot list (CSV), project schema
  (JSON), render handoff manifest and a full ZIP production pack including
  per-stage prompt files and a social copy pack.
- Optional render webhook bridge with per-stage status callbacks.
- REST API + dependency-free vanilla JS studio UI with a dark cinematic
  aesthetic and procedural SVG scene art.
- JSON file persistence with a serialized write queue and a dependency-free
  ZIP writer.
- Test suite (`node --test`) covering engine and API behavior, plus a live
  end-to-end smoke script (`npm run smoke`).
- GitHub Actions CI running tests on Node 20, 22 and 24 with a live smoke
  run on every push and pull request.

[1.1.0]: https://github.com/F4Y547/vidmo/releases/tag/v1.1.0
[1.0.0]: https://github.com/F4Y547/vidmo/releases/tag/v1.0.0
