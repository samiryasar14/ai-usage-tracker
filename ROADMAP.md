# Soar AI Tracker — Roadmap

Current state: Phase 1 core is more complete than the original scaffold notes suggest — ingestion, dashboard, monthly budget alerts, subscriptions CRUD, a naive forecast, and CSV/JSON export all already work end-to-end for the single Claude Code plugin. This roadmap covers the next phases: hardening it into a shippable product, expanding provider coverage, and adding the "advanced" intelligence features the vision doc calls for.

Priorities below reflect: **ship-readiness is near-term**, plus all four tracks (providers, intelligence, UX, native/distribution) matter — so phases run partly in parallel rather than strictly sequential.

## Correctness backlog (do first, regardless of phase)

These aren't new features — they're bugs/gaps in what already exists that will undermine trust in the numbers if left alone:

- **Sidechain/subagent double-counting risk** — `transcriptParser.ts` counts every `type:"assistant"` line with usage as a top-level request. If Claude Code's log format includes subagent/sidechain turns without a distinguishing field being checked, those get counted as regular requests, inflating cost/token totals. Needs verification against a real subagent session's JSONL and a fix to filter or separately attribute sidechain turns.
- **Silent $0 pricing for unknown models** — `ingest.ts` defaults unpriced models to cost `0` with no warning. A new model release (or renamed model string) silently under-reports spend. Add a warning log plus a dashboard indicator ("N requests from unpriced models, cost not included").
- **WebSocket has no reconnect logic** — `connectRefreshSocket` in `api.ts` never retries on close/error. If the connection drops (server restart, sleep/wake), the UI silently stops receiving live updates until a manual reload. Add exponential-backoff reconnect.
- **No loading or error states anywhere in the dashboard** — a failed fetch or slow load is indistinguishable from "no data yet." Add `isLoading`/`isError` handling to the `useQuery` calls in `App.tsx` at minimum for `overview`.

## Phase A — Ship-readiness (near-term)

Goal: a real installable desktop app, not a dev-mode-only tool.

- **Bundle the server** — replace `desktop/src/main.cjs` spawning `tsx src/index.ts` at runtime with a compiled/bundled server (esbuild → single JS file) shipped alongside the app. Runtime `tsx` + raw TS source is not viable for a packaged installer.
- **electron-builder setup** — add build config (NSIS installer for Windows to match this dev machine, plus DMG/AppImage targets) at the root or `packages/desktop`. Wire `pnpm build:desktop` → installer output.
- **Auto-update** — `electron-updater` pointed at GitHub Releases (repo already exists at `samiryasar14/ai-usage-tracker`) so future versions push without manual reinstalls.
- **App icon & installer branding** — currently none; needed for a credible installer.
- **Code signing** — flag only: Windows/macOS signing needs certificates/Apple dev account the user will need to obtain; unsigned builds will trigger SmartScreen/Gatekeeper warnings. Note this as a known limitation until certs are available, not a blocker to shipping.
- **Data location & backup** — SQLite DB path should live in Electron's `userData` dir (confirm `DATABASE_URL` resolves there, not the repo checkout); add a simple export/import of the DB file for backup before upgrades.

## Phase B — UX polish & completeness (parallel with A)

Goal: close the gaps the audit found so the app feels finished, not a scaffold.

- **Loading/error states** — skeleton or spinner states, retry affordance on fetch failure, for every panel.
- **Table interactivity** — click-to-sort headers on Model Leaderboard, Session History, Projects Table; a search/filter box; pagination or "load more" on Session History (currently a hard `limit=50` with no way to see older sessions).
- **Dark mode toggle** — currently OS-preference-only (`prefers-color-scheme`, no manual override). Add an in-app toggle persisted to local storage.
- **Settings page** — first real settings surface: data retention window, alert notification preferences, provider enable/disable (ties into Phase C), export defaults. New route/view — app currently has no routing at all (`App.tsx` is one scrolling column), so this also means introducing basic view-switching.
- **Onboarding / first-run flow** — detect whether `~/.claude/projects` exists and has data; if not, show a short walkthrough instead of an all-empty dashboard.
- **Alert acknowledgement** — `AlertEvent.acknowledgedAt` already exists in the schema but nothing sets it. Add an "Acknowledge" button in `BudgetPanel.tsx` and a `PATCH` endpoint.
- **Subscription editing** — `SubscriptionsPanel.tsx` only supports add/delete today; add in-place edit and a status control (active/cancelled) since the API model already supports `status`.
- **Project drill-down** — clicking a project in `ProjectsTable` currently does nothing; add a detail view showing that project's session/cost history.

## Phase C — More provider plugins

Goal: extend beyond Claude Code, per the original vision doc.

The current `ProviderPlugin` interface (`connect()` + `fetchUsage()`) and hardcoded single-plugin array in `ingest.ts` need to grow up first:

- **Plugin interface v2** — add `disconnect()`, a config/credentials parameter, capability flags (tail-only vs supports-historical-backfill), and health/connection-status reporting beyond a boolean.
- **Plugin registry** — replace the hardcoded `plugins = [new ClaudeCodePlugin()]` array with a configurable registry (enable/disable per provider from the new Settings page).
- **Pricing abstraction** — `pricing.ts` is 100% Claude-specific today (a static hardcoded table). Generalize to a per-provider pricing module pattern, and document/automate how the static snapshot gets refreshed over time (even a manual "last updated" reminder beats silent staleness).
- **Credential storage** — API-based providers (unlike Claude Code's local-log approach) need API keys. Use Electron's `safeStorage` API for OS-level encryption rather than storing keys in plaintext in SQLite.

Suggested plugin order (build order, not necessarily final priority — confirm with user before starting each):
1. **OpenAI** (ChatGPT/Codex usage via API) — well-documented usage API, good second data point.
2. **GitHub Copilot** — usage API exists at the org/enterprise level; individual-plan usage may not be exposable, worth a quick feasibility check before committing.
3. **Cursor** — check whether Cursor keeps local logs similar to Claude Code before assuming an API-based plugin is needed.
4. **Gemini / Google AI Studio** — similar API-key-based shape to OpenAI.

## Phase D — Intelligence & analytics (can overlap Phase C)

Goal: the "advanced" half of "advanced features" — turn raw usage data into insight.

- **Better forecasting** — `forecast.ts` today is pure linear extrapolation (`dailyAverage × daysInMonth`). Add weekday/weekend weighting and month-over-month trend comparison at minimum; per-project/per-model forecasts as a stretch.
- **Anomaly/spike detection** — flag days or sessions that deviate meaningfully from a rolling baseline (simple z-score/IQR is enough — no ML infrastructure needed).
- **Budget rules v2** — `AlertRule` schema already has a `type` field described as "extensible later" but only `monthly_budget` is implemented. Add per-project and per-model budget rules, a daily-budget option, and "approaching threshold" (e.g. 80%) warnings, not just hard-exceeded.
- **Unify subscriptions with usage cost** — `Subscription.monthlyCostUsd` and `Request.cost` are currently two disjoint systems; nothing combines them into a single "total AI spend" figure despite that being the natural product framing. Prorate subscription cost into `getOverview()`/forecast/reports.
- **PDF export** — `reports.ts` currently supports CSV/JSON only.
- **Native OS notifications for alerts** — today alerts only show as an in-app toast; wire budget-exceeded events to Electron's `Notification` API (ties into Phase A/native work below).
- **Insights summary (stretch)** — a short natural-language "what changed this month" summary. Could literally call the Claude API to generate it from the aggregated numbers — worth flagging as a nice dogfooding touch, not a must-have for this phase.

## Phase E — Native desktop integration

Goal: use the fact this is a real desktop app, not just a web page in a window.

- **System tray icon** — persistent tray icon showing live today/month spend, with a right-click menu (open dashboard, quick stats, quit). Currently zero `Tray` usage.
- **Native menu** — currently just Electron's default File/Edit/View/Window/Help menu; add app-specific items (Settings, Export Report, Check for Updates once Phase A auto-update lands).
- **OS notifications** — see Phase D; needs `preload.cjs` to stay a no-op since the main process can call `Notification` directly without renderer IPC.
- **Minimize-to-tray / background running** — so the app can keep ingesting in the background without a visible window, surfacing spend via the tray icon.

## Phase F — Scale/platform hardening (later, only if needed)

Lower priority — flagging so they're not forgotten, not because they're urgent:

- **Data retention/archival** — `Request` table grows unbounded with no pruning; fine for a while, but worth a retention policy (e.g. aggregate-and-drop rows older than N months) before it becomes a real problem.
- **Multi-device sync** — explicitly out of scope unless requested later; the local-first single-machine design (`IngestCursor` keyed by absolute file path) is a deliberate simplicity choice, not an oversight. Only revisit if cross-machine dashboards become a real need.

## Suggested sequencing

Given "shippable soon" plus wanting all four tracks:

1. **Now**: Correctness backlog + Phase A (bundling/packaging) — nothing else matters if it can't be installed and the numbers can't be trusted.
2. **Alongside**: Phase B UX polish — much of it (loading/error states, sorting, dark-mode toggle) is small, high-value, and independent of packaging work.
3. **Next**: Phase E native integration — natural to add once packaging exists (tray/notifications are meaningless in dev-mode-only).
4. **Then**: Phase C (first new provider — OpenAI is the cleanest second integration) and Phase D (forecast/anomaly/budget-rules improvements) in parallel, since they touch different code paths.
5. **Later**: Phase F, only when the data volume or sync need actually shows up.
