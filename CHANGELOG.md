# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- ZIP/ZIP exports now include generated images and clips when present.
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

[1.0.0]: https://github.com/F4Y547/vidmo/releases/tag/v1.0.0
