# Contributing to VidMo Studio

Thanks for your interest in improving VidMo Studio. This project is a
zero-dependency Node.js studio app, and keeping it that way is a core
principle — please open an issue before proposing anything that would add a
runtime dependency or a build step.

## Development setup

Requirements: Node 20.12+ (22 LTS recommended). No install step is needed —
`npm install` is a no-op because there are no dependencies.

```bash
npm start          # run the studio at http://127.0.0.1:4173
npm run dev        # auto-restarting dev server
npm test           # engine + API tests (node --test)
npm run smoke      # live end-to-end check (needs a running server)
```

## Where things live

| Area | Location |
| --- | --- |
| Continuity bibles (audiences) | `src/engine/audiences.js` |
| Dish libraries and stage beats | `src/engine/dishes/` |
| Custom dish analysis + stage templates | `src/engine/custom.js` |
| Prompt builders + audits | `src/engine/prompts.js` |
| Project assembly | `src/engine/project.js` |
| Export builders | `src/engine/exports.js` |
| REST API and static serving | `src/server/` |
| Studio UI (vanilla JS SPA) | `src/web/` |

## The rules that must never break

The production guarantees are enforced in code and asserted by tests. Any
change touching prompts must keep these intact:

1. Every stage has an **image**, a **motion** and an **audio** prompt.
2. Image prompts require **extreme macro photography**, **giant human hands
   vs. tiny food** scale contrast, continuity locks (environment, hands,
   cookware, palette, light) and a clear progression from the previous stage.
3. Audio is **ASMR only**: no music, no background music, no songs, no
   voiceover, no dialogue, no human speech — on every single shot.
4. Stage counts follow complexity: **simple 3–5, medium 5–8, complex 8–12**.
   The final stage is always the plated hero shot.
5. The optional AI planner may propose recipe stages but must **never** write
   the final prompts.

If you change any locked string, update `test/engine.test.js` only if the
mandate itself changed — the tests are the specification.

## Making changes

- Keep the style of the surrounding code: 2-space indent, single quotes,
  trailing commas, descriptive names, small pure functions.
- Add or update tests for behavior changes (`test/engine.test.js` for engine
  logic, `test/api.test.js` for routes). A change is not done until
  `npm test` and `npm run smoke` both pass.
- Update `CHANGELOG.md` under "Unreleased" for user-visible changes.
- One focused commit per change; reference the issue you are fixing.

## Pull requests

1. Fork the repo and create a branch from `main` (`feat/…`, `fix/…`).
2. Make your change, run the full test suite and the smoke test.
3. Open a PR using the template. CI must be green before review.

For bug reports, include your Node version, OS, exact reproduction steps and
the relevant server log lines. Security issues go to `SECURITY.md`, not the
issue tracker.
