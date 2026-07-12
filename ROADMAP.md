# Soar AI Tracker — Roadmap

Current state: Phase 1 core is more complete than the original scaffold notes suggest — ingestion, dashboard, monthly budget alerts, subscriptions CRUD, a naive forecast, and CSV/JSON export all already work end-to-end for the single Claude Code plugin. This roadmap covers the next phases: hardening it into a shippable product, expanding provider coverage, and adding the "advanced" intelligence features the vision doc calls for.

Priorities below reflect: **ship-readiness is near-term**, plus all four tracks (providers, intelligence, UX, native/distribution) matter — so phases run partly in parallel rather than strictly sequential.

## Correctness backlog

Resolved — sidechain/subagent turns are now excluded from every cost/token aggregation (`isSidechain: false` across `aggregations.ts`, `alerts.ts`, `recommendations.ts`, `reports.ts`, `forecast.ts`), unpriced models surface a dashboard warning, the WebSocket reconnects with exponential backoff, and the dashboard shows loading/error states.

## Phase A — Ship-readiness (near-term)

Goal: a real installable desktop app, not a dev-mode-only tool.

Done: server bundling, electron-builder + NSIS installer, app icon, auto-update via `electron-updater`/GitHub Releases, and native update notifications. DB already lives in Electron's `userData` dir, with a "Backup Database" / "Open Data Folder" pair in Settings.

- **Code signing** — flag only: Windows/macOS signing needs certificates/Apple dev account the user will need to obtain; unsigned builds will trigger SmartScreen/Gatekeeper warnings. Note this as a known limitation until certs are available, not a blocker to shipping.

## Phase B — UX polish & completeness (parallel with A)

Goal: close the gaps the audit found so the app feels finished, not a scaffold.

Done:
- **Loading/error states** — every panel backed by a query (Model Leaderboard, Session History, Projects Table, Budget Alerts, Subscriptions, Activity) now shows a loading state and a retry-on-error banner via the shared `QueryState` component.
- **Table interactivity** — click-to-sort headers on Model Leaderboard, Session History, and Projects Table (`useSortableRows` + `SortableTh`); a filter box on Model Leaderboard and Session History; "Load more" pagination on Session History.
- **Dark mode toggle** — already done (manual toggle in the sidebar, persisted to `localStorage`).
- **Settings page** — already had routing/view-switching (the roadmap note above was stale). Added: data retention window (with actual server-side pruning, off by default), a budget-alert notification toggle, export defaults (period/format), and a Connected Providers list.
- **Onboarding / first-run flow** — `Onboarding.tsx` replaces the dashboard when there's no usage data at all, explaining what the app watches for.
- **Alert acknowledgement** — `PATCH /api/alerts/events/:id/acknowledge` + an "Acknowledge" button in `BudgetPanel.tsx`.
- **Subscription editing** — in-place edit (name/cost/renewal day/status) in `SubscriptionsPanel.tsx`, backed by the existing `PUT /api/subscriptions/:id`.
- **Project drill-down** — already done (`ProjectDetail.tsx`, the roadmap note above was stale).

## Phase C — More provider plugins

Goal: extend beyond Claude Code, per the original vision doc.

Done:

- **OpenAI** — already existed going into this phase (`packages/plugins/openai`), pulling usage/cost from OpenAI's organization admin API. Nothing further needed.
- **Plugin interface v2 (right-sized)** — `ProviderPlugin` gained `displayName` and `requiresCredentials`; skipped adding a plugin-level `disconnect()` since there's no resource to release beyond the credential file, which the registry already handles.
- **Plugin registry** — `packages/server/src/providers.ts` replaces the hardcoded plugin array. Each provider's enabled/disabled state is a `Setting` row (`provider:<name>:enabled`, default on); `runIngestionCycle` only fetches from enabled plugins.
- **Credential storage** — generalized from OpenAI-only to any provider: `packages/desktop/src/main.cjs` now has generic `credentialPath`/`readDecryptedCredential` helpers and `save-credential`/`has-credential`/`clear-credential` IPC handlers, keyed by provider name.
- **Settings UI** — the Providers section is now driven by `GET /api/providers` (`ProviderCard.tsx`), showing live connection status and an enable/disable toggle for every registered provider, credentialed or not.
- **GitHub Copilot** — feasibility confirmed (`GET /users/{username}/settings/billing/usage`, a real per-user billing API requiring a PAT with access to GitHub's enhanced billing platform) and built (`packages/plugins/github-copilot`). Caveat: this API reports billed dollar amounts and quantities, not token counts — Copilot rows will always show 0 tokens with an accurate cost. Also unverified against a live enhanced-billing account: whether omitting the `day` query param returns the whole month (assumed) or just one day — worth confirming with a real account before trusting historical backfill from it.
- **Pricing abstraction** — turned out not to be needed as originally scoped. Every non-Claude plugin (OpenAI, GitHub Copilot) supplies `precomputedCostUsd` directly from its own API instead of going through the shared Claude-specific pricing table, which sidesteps the need for a generalized per-provider pricing module.

Still open:

- **Cursor** — no official usage/billing API exists. Local data is an undocumented SQLite store (`state.vscdb`) with chat/session history, not a clean token/cost log like Claude Code's JSONL — reverse-engineering it risks feeding wrong numbers into the one thing this app promises to get right. Not attempted; would need much more dedicated research (or an official API shipping) before it's worth building.
- **Gemini / Google AI Studio** — no per-key admin usage-query endpoint comparable to OpenAI's was found; billing runs through a Cloud Billing account, which likely means a heavier integration (Cloud Billing export / BigQuery) than the API-key pattern the other plugins use. Not attempted — needs a scoping decision before starting.

## Phase D — Intelligence & analytics (can overlap Phase C)

Goal: the "advanced" half of "advanced features" — turn raw usage data into insight.

Done:

- **Better forecasting** — `forecast.ts` now buckets completed days into weekday/weekend averages and projects remaining full days using the matching bucket (falls back to a flat average until both bucket types have data), plus a month-over-month `trendPercent` comparing spend through the same elapsed-day point last month. Per-project forecasts already existed via `recommendations.ts`'s trailing-30-day-average + trend recommendation, so the "stretch" case here was effectively already covered — per-model forecasts weren't added on top of that.
- **Anomaly/spike detection** — `anomalies.ts`, a simple z-score (≥2σ over a 30-day baseline) flagging over-baseline spend spikes, surfaced as a "Spending anomalies" panel on the dashboard when any exist.
- **Budget rules v2** — `AlertRule` gained `scope`/`scopeId` (global/project/model) and `type` now supports `daily_budget` alongside `monthly_budget`. `BudgetPanel.tsx` is a real CRUD list (add/enable/disable/remove any number of rules) instead of one hardcoded global-monthly form. The existing 80%-"approaching" threshold logic carried over unchanged.
- **Unify subscriptions with usage cost** — `getOverview()` prorates active subscriptions to a daily rate and adds `subscriptionCostSoFar`/`totalSpendSoFar`; `forecast.ts` adds the full active-subscription total to `totalProjectedCost` (subscriptions bill in full regardless of usage, so nothing to project there). The dashboard's top stat cards now show the combined figures.
- **PDF export** — `GET /api/reports/export?format=pdf` via `pdfkit`. A raw per-request dump doesn't make a readable PDF at any real data volume, so this is a summary (totals + cost by model/project) rather than mirroring the row-level CSV/JSON.
- **Native OS notifications for alerts** — already done in Phase B (`showNativeNotification` wired to the websocket's `onAlert`, with a Settings toggle to turn it off).
- **Insights summary** — built, but as a deterministic summary (`insights.ts`, composed from forecast/leaderboard/project/anomaly data already computed elsewhere) rather than an LLM call, so it needs no additional API credential and can't hallucinate a number the rest of the dashboard doesn't already show.

## Phase E — Native desktop integration

Goal: use the fact this is a real desktop app, not just a web page in a window.

- **System tray icon** — persistent tray icon showing live today/month spend, with a right-click menu (open dashboard, quick stats, quit). Currently zero `Tray` usage.
- **Native menu** — currently just Electron's default File/Edit/View/Window/Help menu; add app-specific items (Settings, Export Report, Check for Updates once Phase A auto-update lands).
- **OS notifications** — see Phase D; needs `preload.cjs` to stay a no-op since the main process can call `Notification` directly without renderer IPC.
- **Minimize-to-tray / background running** — so the app can keep ingesting in the background without a visible window, surfacing spend via the tray icon.

## Phase F — Scale/platform hardening (later, only if needed)

Lower priority — flagging so they're not forgotten, not because they're urgent:

- **Data retention/archival** — a user-configurable retention window now exists (Settings → "Keep detailed request history for", default "Forever") with real pruning on each ingestion cycle. Still open: aggregate-and-archive (rather than hard-delete) older rows, so long-term trend charts survive a short retention window.
- **Multi-device sync** — explicitly out of scope unless requested later; the local-first single-machine design (`IngestCursor` keyed by absolute file path) is a deliberate simplicity choice, not an oversight. Only revisit if cross-machine dashboards become a real need.

## Suggested sequencing

Correctness backlog, Phase A, Phase B, Phase C, and Phase D are all done (see each section above for specifics and the few genuinely-open items: code signing certs, Cursor/Gemini plugins). What's left:

1. **Next**: Phase E native integration — tray icon, native menu, minimize-to-tray. Natural now that packaging (Phase A) and notifications (Phase D) already exist.
2. **Later**: Phase F, only when the data volume or multi-device need actually shows up.
