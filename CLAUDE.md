# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FLOW is a meeting-management app ("Sistema FLOW", Spanish UI/domain language) with two parts:

- **Backend**: a single-file Express + MySQL REST API (`js/server/server.js`).
- **Frontend**: a vanilla-JS single-page app with no bundler/framework/build step. `index.html` contains every view as a `<section>` in one document; navigation just toggles a `view--hidden` class (see `js/services/viewManager.js`). `vista-login.html` is a separate standalone login page.

There is no test suite, linter, or build tooling configured in this repo.

## Commands

- `npm start` / `npm run dev` — both just run `node js/server/server.js`. There's no file-watcher/nodemon, so restart manually after backend edits.
- The frontend has no dev server or bundler. Open `index.html` / `vista-login.html` directly (or serve the folder statically) — JS is loaded via native `<script type="module">` imports.
- No test, lint, or build scripts exist. Don't assume `npm test`/`npm run build` work.

## Backend architecture (`js/server/`)

- `server.js` is the entire API: all routes are defined inline in one file (no router modules, no controllers/services split). New endpoints should follow the same pattern — inline `app.METHOD(path, async (req, res) => { try {...} catch {...} })` handlers with manual validation and a consistent `{ ok, mensaje, ... }` JSON response shape.
- `db.js` creates a single `mysql2/promise` connection pool, loading credentials from `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). `.env` is gitignored — never commit it.
- Passwords are hashed with `bcrypt` (not `bcryptjs` — that dependency is present in `package.json` but unused; don't use it for new code).
- Multi-statement writes (e.g. saving meeting participants) use `db.getConnection()` + manual `beginTransaction()/commit()/rollback()` rather than the pool directly — follow this pattern for any new multi-query write.
- `server_old.js` is a stale, unused backup of an earlier version of `server.js` — not required by anything in `package.json`. Don't edit it; treat `server.js` as the sole source of truth for the API.
- Key tables referenced: `usuarios`, `subsidiaries`, `areas`, `reuniones`, `reunion_secciones` (per-meeting content stored as JSON blobs keyed by section name, with an `ON DUPLICATE KEY UPDATE` upsert pattern), `reunion_participantes`.

## Frontend architecture (`js/`)

- `js/main.js` is the SPA entry point loaded from `index.html`. It wires together components, initializes navigation (`data-view` attributes on buttons/cards drive `showView()`), and defines the meeting lifecycle callbacks (`initMeetingLifecycle` in `js/services/meetingLifecycle.js`) for start/pause/resume/end.
- `js/components/` — one file per UI widget (editable lists, commitment list, development table, text sections, link list, user registration/edit/management, login, archive/history views). Components are factory functions (`createXxx({ container, storageKey, ... })`) returning an object with methods, not classes.
- `js/services/` — cross-cutting concerns:
  - `session.js` tracks the currently active meeting ID (`getReunionActivaId`/`setReunionActivaId`) and builds per-meeting-per-section storage keys via `sectionKey()`.
  - `storage.service.js` is the persistence layer components call (`loadData`/`saveData`). It keeps an in-memory cache + `localStorage` as a fallback/backup, while transparently syncing meeting-section data to MySQL via `PUT /api/reuniones/:id/secciones/:seccion` (fire-and-forget from `saveData`, awaited via `cargarSeccionesDesdeBD` on meeting load). Non-meeting keys (e.g. `meta`, active-meeting-id) stay purely local. When adding a new persisted field, decide whether it belongs in a `flow.reunion.<id>.<seccion>` key (synced to DB) or a plain local key.
  - `auth.service.js` handles the real session (`sessionStorage` key `flow.usuario`, used by `main.js` to redirect to `vista-login.html` when unauthenticated). **Note:** `js/services/auth.js` is a dead duplicate of `session.js` (not `auth.service.js`, despite the name) — nothing imports it; don't confuse the two "auth" files.
  - `viewManager.js` is the whole "router": a static map of view-name → DOM section, toggled via CSS class.
- **Deployment model:** each teammate runs the full stack locally — their own `npm start` (backend) serving their own `index.html` (frontend) — and all instances share one remote MySQL server. `js/components/config.js`'s `API_URL` (`http://localhost:3000/api`) reflects this: it always points to the *same machine's* backend, never a teammate's IP. `DB_HOST` in `.env` (a separate, dedicated MySQL server) is the only thing actually shared over the network. There's no env-based config for the frontend, so if this ever needs to change (e.g. a real shared backend deployment), it's a manual edit here.
- `js/state/` and `js/views/` exist but are currently empty.
- CSS lives in `css/base` (reset/typography/variables), `css/layout` (app shell/view), and `css/components` (one file per component, mirroring `js/components/`), plus top-level `login.css` and `main.css` entry points.

## Conventions to preserve

- Domain/UI language is Spanish throughout (variable names, DB columns, route payload keys like `nombre`, `correo_electronico`, `mensaje`) — match this in new code rather than switching to English.
- Backend responses always use the shape `{ ok: boolean, mensaje?: string, error?: string, ...data }`; match it for new endpoints.
- Frontend code is heavily vertically formatted (one identifier/argument per line inside a statement). This is a strong stylistic pattern throughout the existing codebase — follow it when editing these files for consistency, even though it's more verbose than typical JS style.
