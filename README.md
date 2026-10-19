# VidMo Studio

**A miniature-cooking film director in a box.** Give it an audience and a dish, and it produces a complete vertical-video production package: a recipe-aware stage plan, extreme-macro image prompts, physically believable motion prompts, a strict ASMR-only audio policy, and every export a renderer or editor needs.

Built for the viral "miniature cooking" Shorts/Reels format: **giant human hands + tiny hyper-realistic food + extreme macro + ASMR**.

[![CI](https://github.com/F4Y547/vidmo/actions/workflows/ci.yml/badge.svg)](https://github.com/F4Y547/vidmo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.12-339933.svg)](https://nodejs.org)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#quick-start)
[![Tests: 12](https://img.shields.io/badge/tests-12%20passing-brightgreen.svg)](test)
[![Smoke: 44 checks](https://img.shields.io/badge/smoke-44%20checks-brightgreen.svg)](scripts/smoke.mjs)

| Audience lock | Dish choice |
| --- | --- |
| ![Audience selection](docs/screenshot-audience.png) | ![Dish idea board](docs/screenshot-ideas.png) |

![Storyboard with lock score](docs/screenshot-storyboard.png)

## Why this exists

Anyone can prompt a video model once. The hard part of the miniature-cooking format is **consistency across a whole film**: the same hands, the same tiny cookware, the same light, a believable 1:12 scale, and sound that is pure ASMR — no music, no voice, no exceptions. VidMo Studio encodes those rules as locked prompt blocks, audits every edit against them, and keeps every shot on-model from the first cut to the plating hero shot.

## Quick start

```bash
npm start          # → http://127.0.0.1:4173
```

Requires Node 20.12+ (22 LTS recommended). No install step, no build step, **zero dependencies**.

```bash
npm test           # engine + API test suite (built-in node:test)
npm run smoke      # live end-to-end smoke test against a running server
npm run dev        # auto-restarting dev server
```

## The 5-step workflow

1. **Audience** — pick *English-Speaking West* or *India & Pakistan*. This choice locks the continuity bible: environment, hands, cookware, lighting, palette, ambience and cultural rules — re-applied to every single stage prompt.
2. **Dish ideas** — 10 hand-authored, audience-matched dishes, each with a curated stage plan, complexity tier and estimated runtime.
3. **Dish choice** — pick one of the ten, or type any custom dish (name + ingredients). Custom dishes are analyzed locally (keyword signals + ingredient count) or optionally by an AI planner, and get a stage count that follows real recipe complexity.
4. **Stage plan** — stage count follows complexity, never a fixed number: **simple 3–5, medium 5–8, complex 8–12** stages, targeting a 20–60s total runtime.
5. **Storyboard** — every stage ships three locked prompts:
   - **Image** — extreme macro photography, hyper-realistic miniature, giant hands vs. tiny food, correct stage/ingredients, tiny cookware, shallow DOF, cinematic lighting, 8K detail, viral Shorts framing, explicit progression from the previous stage.
   - **Motion** — start frame matched to the image, timed movement, camera behavior, scale and continuity locks.
   - **Audio** — ASMR only: no music, no background music, no songs, no voiceover, no dialogue, no human speech. Ever.

The final stage of every film is always the plating hero: finished dish, professional garnish, tiny serving plate, giant fingers making the final adjustment — the most appetizing, thumbnail-worthy frame of the sequence.

Prompt editing and rerolling are built in, and every edit is **audited**: break a production lock (e.g. remove the macro requirement) and the lock score drops, the failing stage is flagged with exactly what's missing, and one click rerolls the prompts back to a compliant state.

## Guaranteed production rules

These are enforced in the prompt engine and asserted by the test suite — they cannot be bypassed, including by the AI planner (which may only propose recipe stages, never the final prompts):

- Every stage carries **image + motion + audio** prompts.
- **Extreme macro photography** with a tack-sharp focus on the current cooking state.
- **Giant human hands vs. tiny food** scale contrast (hands ≈ 12× the cookware height; the dish smaller than a fingertip).
- **Continuity locks** on every stage: environment, hands, cookware family, light direction, palette and table surface.
- **ASMR-only audio** on every shot: no music, no songs, no voiceover, no dialogue, no human speech.
- **Complexity-based stage count** (3–5 / 5–8 / 8–12) with a plated **hero shot** as the final stage.

## Exports

From the Production pack step (or directly via API):

| Artifact | What it is |
| --- | --- |
| `format=md` | Director briefing: continuity bible + full storyboard |
| `format=csv` | Shot list, spreadsheet-ready with all prompts |
| `format=json` | Machine-readable project schema |
| `format=handoff` | Model-agnostic render job manifest |
| `format=zip` | Full production pack: README, manifest, shot list, continuity doc, social copy and per-stage prompt files |

The ZIP also includes a social copy pack: titles, hooks, captions, hashtags and platform copy for YouTube Shorts, TikTok and Reels.

## Render bridge

Live rendering is external. Two ways to finish a film:

- **Pack export mode (default)** — download the ZIP or handoff JSON and submit shots to a video model yourself (tested flows: Veo 3.1, Kling 2.5, Runway Gen-4, Sora 2).
- **Webhook mode** — set `VIDMO_RENDER_WEBHOOK` and the studio submits the full handoff manifest automatically. `POST /api/projects/:id/render` queues all shots; renderers report per-stage progress back to `/api/render/callback` (optionally secured with `VIDMO_RENDER_CALLBACK_SECRET`), and the studio tracks submitted → in-progress → complete per stage.

## Configuration

Everything is optional — see [`.env.example`](.env.example) for the full list. Without a `.env` file the studio runs fully offline with the deterministic local planner.

| Variable | Purpose |
| --- | --- |
| `PORT`, `HOST` | Local server address (default `4173` / `127.0.0.1`) |
| `VIDMO_DATA_DIR` | Where `store.json` is written (default `./data`) |
| `OPENAI_API_KEY` / `VIDMO_AI_API_KEY` | Enables the optional AI recipe planner |
| `OPENAI_BASE_URL`, `OPENAI_MODEL` | Any OpenAI-compatible endpoint and model |
| `VIDMO_RENDER_WEBHOOK`, `VIDMO_RENDER_WEBHOOK_TOKEN` | Render bridge submission |
| `VIDMO_PUBLIC_URL` | Public URL used for render callbacks |
| `VIDMO_RENDER_CALLBACK_SECRET` | Required `X-VidMo-Secret` header on callbacks |

> `.env` file loading uses Node's `process.loadEnvFile` (Node 20.12+). On older runtimes, set environment variables directly.

## API sketch

```
GET    /api/health
GET    /api/bootstrap                     audiences, projects, settings
GET    /api/ai/status                     planner configuration
POST   /api/analyze                       custom-dish complexity analysis
GET    /api/projects                      film library
POST   /api/projects                      { audience: "western" | "desi" }
GET    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/select           { dishId } or { dishId: "custom", customDish: { name, ingredients } }
POST   /api/projects/:id/storyboard       build the locked prompt set
PATCH  /api/projects/:id/stage/:n         edit a stage prompt (audited)
POST   /api/projects/:id/stage/:n/reroll  regenerate a stage's prompts
GET    /api/projects/:id/export?format=md|csv|json|handoff|zip
POST   /api/projects/:id/render           submit via render bridge
POST   /api/render/callback               renderer status reports
```

## Project structure

```
server.js                 entry point
src/server/app.js         REST API, static serving, render bridge
src/server/store.js       JSON persistence (serialized write queue)
src/server/zip.js         dependency-free ZIP writer
src/server/ai.js          optional OpenAI-compatible planner
src/engine/audiences.js   the two continuity bibles
src/engine/dishes/        20 hand-authored dishes with stage beats
src/engine/custom.js      custom-dish complexity detection + stage templates
src/engine/prompts.js     image/motion/audio prompt builders + audits
src/engine/exports.js     markdown/CSV/JSON/handoff/pack builders
src/web/                  the studio UI (vanilla JS SPA, no build step)
test/                     engine + API tests
scripts/smoke.mjs         live end-to-end smoke test
```

Films are persisted to `data/store.json` (gitignored). Deleting that file resets the studio.

## Development

- `npm test` — 12 tests covering the engine rules and the API workflow.
- `npm run smoke` — 44 live checks: the full workflow, all prompt locks, custom dishes, every export format and the static client.
- CI runs both on Node 20, 22 and 24 for every push and pull request.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md), and security reports should follow [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Faysal Matheen
