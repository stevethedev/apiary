# Apiary

A lightweight, local-first desktop API client — a focused alternative to Postman/Insomnia for creating, sending, inspecting, and organizing HTTP requests. Built with Tauri, React, and Rust.

Everything lives on disk in a local SQLite file. No accounts, no cloud sync, no telemetry.

## Features

- **Request editor** — method + URL with live query-param sync, headers (with a read-only preview of what's auto-generated from Auth/Body), auth (None/Bearer/Basic/API Key), and body (None/JSON with syntax highlighting/Raw/Form URL-encoded)
- **Response viewer** — status, timing, size, formatted JSON (large responses fall back to plain text instead of freezing the UI), headers, and parsed `Set-Cookie` values
- **Collections** — organize saved requests, drag-to-reorder, rename/duplicate/delete
- **Environments** — `{{variable}}` substitution with a switchable active environment; secret values are masked in the UI; sending is blocked with an inline error if a variable is undefined
- **History** — every sent request, click to restore into a new tab
- **Multi-tab editing** — open tabs and their unsaved drafts persist across restarts
- **Dark and light themes** — follows the OS by default, or set explicitly
- **Keyboard-first**

| Shortcut           | Action                  |
| ------------------ | ----------------------- |
| `Cmd/Ctrl + Enter` | Send the active request |
| `Cmd/Ctrl + S`     | Save the active request |
| `Cmd/Ctrl + T`     | New tab                 |
| `Cmd/Ctrl + L`     | Focus the URL bar       |
| `Cmd/Ctrl + K`     | Focus sidebar search    |
| `Cmd/Ctrl + W`     | Close the active tab    |

## Tech stack

- **Shell:** [Tauri 2](https://v2.tauri.app/)
- **Frontend:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, [Zustand](https://github.com/pmndrs/zustand), [Monaco Editor](https://microsoft.github.io/monaco-editor/) (self-hosted, fully offline)
- **Backend:** Rust, [`reqwest`](https://github.com/seanmonstar/reqwest) for HTTP, [`rusqlite`](https://github.com/rusqlite/rusqlite) for persistence

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 24+ and [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (stable) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

### Run it

```sh
pnpm install
pnpm tauri dev
```

### Build a release bundle

```sh
pnpm tauri build
```

## Development

```sh
pnpm dev            # Vite dev server only (no native shell)
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint --max-warnings=0 .
pnpm lint:fix       # eslint --fix .
pnpm format         # prettier --check .
pnpm format:fix     # prettier --write .
pnpm test           # vitest run
```

```sh
cd src-tauri
cargo build
cargo test
cargo clippy --all-targets   # pedantic + cargo lint groups, deny-level
```

Both the TypeScript and Rust checks run in CI on every push and PR (`.github/workflows/`).

## Releasing

Versioning and releases are automated via [Changesets](https://github.com/changesets/changesets) — see `.changeset/README.md`. In short: `pnpm changeset` describes a change, merging to `main` gets it picked up into an auto-maintained "Version Packages" PR, and merging that PR tags the release and kicks off a cross-platform build (macOS/Linux/Windows) that attaches installers to a draft GitHub Release.

## Project structure

```text
src/
  components/         shared UI (dialogs, method badge, theme toggle, ...)
  features/
    requests/          request editor, tabs, HTTP send/response state
    collections/        collections sidebar + store
    environments/       environment switcher/editor + store
    history/            history list + store
  lib/                 pure helpers (formatting, variable resolution, Tauri IPC wrappers)
  types/               shared domain types (mirror the Rust models 1:1)

src-tauri/
  src/
    commands/          one #[tauri::command] module per entity (collections, requests, ...)
    http/               request execution, auth, cancellation, typed errors
    database/           SQLite connection + migration runner
    models/             Rust structs mirroring src/types/
  migrations/           versioned .sql files, applied in order at startup
```

## How requests work

1. The frontend resolves every `{{variable}}` reference against the active environment (`src/features/requests/variableResolution.ts`). If anything is missing, Send is blocked and the request is never dispatched.
2. The fully-resolved request is sent to Rust via the `send_request` command, which executes it with `reqwest` on a background task and supports cancellation.
3. Rust returns status/headers/body/timing, or a typed `HttpError` (network, DNS, timeout, TLS, etc.) — never a raw stack trace.
4. The frontend records a full, unresolved snapshot of what was sent (method/url/headers/body with `{{vars}}` intact) to History, independent of whether the request was saved.

## Data model

Collections, requests, environments/variables, history, and open-tab drafts are each their own SQLite table (`src-tauri/migrations/`) — not one JSON blob. Secrets (bearer tokens, passwords, API keys) are stored in plaintext; this is a local, single-user file, and the UI masks them, but there's no OS-keychain integration.
