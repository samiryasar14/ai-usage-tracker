# Changelog

## v0.2.0 — 2026-07-11

- Fixed the packaged Windows app opening to a blank white screen. The dashboard build was emitting root-absolute asset URLs, which 404 under the `file://` protocol Electron loads the packaged app from.
- Fixed the app/taskbar/installer icon showing the generic Electron icon instead of the actual Soar AI Tracker logo.
- Updated GitHub links and auto-update config to the `sysamiryasar` account (renamed from `samiryasar14`); the repo stays the same, only the owner name changed.

## v0.1.0 — 2026-07-09

- Initial packaged release: Windows installer, dashboard, budget alerts, subscriptions tracking, and CSV/JSON export.
