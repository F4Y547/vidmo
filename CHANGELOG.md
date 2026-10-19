# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
