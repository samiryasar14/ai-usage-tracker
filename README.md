# AI Usage Hub

A local-first desktop app for tracking usage and spend across AI coding tools, starting with Claude Code.

## What it does

AI Usage Hub tails your local Claude Code session logs (`~/.claude/projects/*/*.jsonl`), normalizes token/cost usage per request, and surfaces it in a live dashboard: spend over time, model leaderboard, per-project breakdown, session history, budget alerts, and a simple cost forecast.

It runs as an Electron desktop app with an embedded local server — no data leaves your machine.

## Architecture

This is a pnpm monorepo:

| Package | Description |
| --- | --- |
| `packages/shared` | Shared types, the `ProviderPlugin` interface, and the Claude model pricing table |
| `packages/db` | Prisma schema + SQLite database (`Provider`, `Model`, `Project`, `Session`, `Request`, `IngestCursor`, `AlertRule`, `AlertEvent`, `Subscription`) |
| `packages/plugins/claude-code` | Provider plugin that discovers and tails Claude Code's local JSONL transcripts, normalizing assistant-turn usage into the shared schema |
| `packages/server` | Fastify REST + WebSocket API, with a background ingestion loop that watches log files and pushes live updates |
| `packages/dashboard` | React/Vite/Tailwind/ECharts dashboard, backed by React Query |
| `packages/desktop` | Electron shell that spawns the server as a child process and loads the dashboard |

Only the Claude Code plugin is implemented so far — the `ProviderPlugin` interface is designed so other providers (OpenAI, Gemini, etc.) can be added later.

## Getting started

Requires Node >= 20 and pnpm.

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev:desktop
```

`dev:desktop` launches the Electron app, which starts the embedded server (default `http://127.0.0.1:4317`) and loads the dashboard.

### Other dev entry points

```bash
pnpm dev:server     # run just the Fastify server
pnpm dev:dashboard  # run just the Vite dev server against a running server
```

### Other scripts

```bash
pnpm build       # build all packages
pnpm typecheck    # typecheck all packages
pnpm db:seed      # seed the database with sample data
```

## Status

Phase 1 (core) scaffold: single-provider (Claude Code) ingestion, dashboard, and desktop shell. Additional provider plugins, subscription tracking, local-model GPU stats, and richer alerting are planned but out of scope for now.
