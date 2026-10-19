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

## Reporting a vulnerability

Please do not open a public issue for security problems. Report privately via
GitHub's [security advisories](https://github.com/F4Y547/vidmo/security/advisories/new)
or email the maintainer at faysalmatheen@gmail.com.

You can expect an acknowledgement within a few days. Once a fix is released,
the issue will be disclosed in the changelog with credit unless you prefer to
stay anonymous.
