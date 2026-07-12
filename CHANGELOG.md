# Changelog

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
