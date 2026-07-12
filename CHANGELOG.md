# Changelog

## v0.7.0 — 2026-07-12

- Data retention now archives before it deletes: pruned days are rolled up into a daily total first, so the usage timeline keeps showing history past your configured retention window instead of that history just disappearing.
- Added manual multi-device sync (Settings → Multi-device sync): export your usage data on one machine, import it on another. Safe to import the same file more than once — duplicate requests are never double-counted.

## v0.6.0 — 2026-07-12

- Added a system tray icon showing live today/month spend in the tooltip, with an Open Dashboard / Check for Updates / Quit menu.
- **Behavior change**: closing the window now minimizes to tray instead of quitting — the app keeps tracking usage in the background. Use the tray icon's Quit to actually exit.
- Fixed the packaged app shipping with no icon file on disk at runtime (only what was baked into the .exe icon itself) — needed for the new tray icon, but was a latent gap either way.

## v0.5.0 — 2026-07-12

- Smarter monthly forecast — weighs remaining days by weekday/weekend average instead of a single flat daily rate, and shows a month-over-month trend on the dashboard.
- New "Spending anomalies" panel flags days that are unusually high vs. your trailing 30-day average.
- Subscriptions are now unified with usage cost: "Total spend so far" and "Projected month-end spend" combine metered usage with prorated subscription fees, instead of showing usage cost alone.
- Added PDF export (summary by model/project, alongside the existing CSV/JSON row-level exports).
- Budget rules are now per-project or per-model, not just account-wide, and support a daily budget in addition to monthly. The Budget Alerts panel lets you add/enable/disable/remove any number of rules.
- Added a deterministic "Insights" summary — a few sentences on what changed this month (spend trend, top model/project, anomalies), built entirely from numbers already on the dashboard rather than an LLM call.

## v0.4.0 — 2026-07-12

- Added a GitHub Copilot plugin — pulls per-day billed usage from GitHub's billing usage API (personal access token required; connect it from Settings → Providers).
- Providers are now a real registry instead of a hardcoded list: every connected provider (Claude Code, OpenAI, GitHub Copilot) gets its own enable/disable toggle and live connection status in Settings.
- Provider plugin credentials now share one generic, encrypted-at-rest storage path instead of OpenAI-specific code, making it straightforward to add the next provider.
- Fixed the "unpriced model" warning incorrectly flagging every OpenAI (and now GitHub Copilot) request as cost-not-counted — it only checked the local Claude-specific pricing table, ignoring that these plugins already supply an accurate cost directly from their own APIs.

## v0.3.0 — 2026-07-12

- Fixed subagent/sidechain turns being counted as regular requests, inflating cost and token totals in the overview, model leaderboard, project analytics, session history, budget alerts, forecast, and reports.
- Every panel backed by live data (Model Leaderboard, Session History, Projects Table, Budget Alerts, Subscriptions, Activity) now shows a loading state and a retry-on-error banner instead of silently rendering as empty.
- Added click-to-sort headers to Model Leaderboard, Session History, and Projects Table, plus a filter box on Model Leaderboard and Session History.
- Session History now supports "Load more" instead of a hard 50-row cap.
- Added an "Acknowledge" action on budget alerts.
- Subscriptions now support in-place editing (name, cost, renewal day, status), not just add/delete.
- Settings gained a data-retention window (off by default), a budget-alert notification toggle, export defaults, and a connected-providers list.
- Added a first-run empty state explaining what the app watches for, instead of an all-zero dashboard.

## v0.2.0 — 2026-07-11

- Fixed the packaged Windows app opening to a blank white screen. The dashboard build was emitting root-absolute asset URLs, which 404 under the `file://` protocol Electron loads the packaged app from.
- Fixed the app/taskbar/installer icon showing the generic Electron icon instead of the actual Soar AI Tracker logo.
- Updated GitHub links and auto-update config to the `sysamiryasar` account (renamed from `samiryasar14`); the repo stays the same, only the owner name changed.
- Fixed subagent/sidechain turns being counted as regular requests, inflating cost and token totals across the dashboard, alerts, forecast, and reports.

## v0.1.0 — 2026-07-09

- Initial packaged release: Windows installer, dashboard, budget alerts, subscriptions tracking, and CSV/JSON export.
