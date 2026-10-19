# Security Policy

## Supported versions

Only the latest release on `main` is supported with security fixes.

## Security model

VidMo Studio is designed as a **local-first** tool:

- The server binds to `127.0.0.1` by default and has no authentication layer.
  It is not intended to be exposed directly to the internet. If you need
  remote access, put it behind a reverse proxy with authentication.
- Film data is stored as plain JSON under `data/` (or `VIDMO_DATA_DIR`).
  It is not encrypted; do not store secrets in dish or project fields.
- Static file serving is path-traversal guarded and restricted to the
  bundled web assets; API inputs are validated and length-capped.
- The optional render bridge sends project manifests to a webhook you
  configure. Use `VIDMO_RENDER_WEBHOOK_TOKEN` if your renderer requires a
  bearer token, and `VIDMO_RENDER_CALLBACK_SECRET` to require an
  `X-VidMo-Secret` header on callbacks.
- AI planner requests (when enabled) go only to the `OPENAI_BASE_URL` you
  configure, using the API key you provide. Keys are read from environment
  variables and are never written to the data store or returned by the API.
- Google Flow automation uses the optional `playwright-core` driver to attach
  to a visible Chrome/Edge window with a dedicated local profile
  (`data/flow-profile`). VidMo never asks for, proxies or stores Google
  credentials, cookies or session tokens; the sign-in happens directly on
  Google's page and the session stays in the local browser profile. Flow
  diagnostics (screenshots, DOM/ARIA snapshots and body-text previews) are
  written under `data/flow/diagnostics/` on this machine and are not uploaded.
  Generated media, uploads and assets are stored under `data/media/`; the media
  endpoint only serves files registered to a project's assets, with Range
  support.

## Flow-specific notes

- Only run Flow automation against **your own** Google account, and only where
  it complies with Google's Terms of Service for the Flow web app.
- The selector map (`src/server/flow/selectors.js`, override
  `data/flow/selectors.json`) is user-auditable plain text. VidMo stops and
  waits for you on captchas, credit limits, terms prompts or unexpected UI — it
  does not bypass them.
- Treat `data/` as sensitive: it can contain Flow project names, screenshots of
  your signed-in Flow session and generated media. Add it to backups or
  deletion policies accordingly (it is gitignored by default).

## Reporting a vulnerability

Please do not open a public issue for security problems. Report privately via
GitHub's [security advisories](https://github.com/F4Y547/vidmo/security/advisories/new)
or email the maintainer at faysalmatheen@gmail.com.

You can expect an acknowledgement within a few days. Once a fix is released,
the issue will be disclosed in the changelog with credit unless you prefer to
stay anonymous.
