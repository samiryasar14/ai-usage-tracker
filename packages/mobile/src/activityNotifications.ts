import { useEffect, useRef } from "react";
import { api } from "./apiClient";
import { getLastSeenActivity, saveLastSeenActivity } from "./storage";
import { notifyLocal } from "./notifications";

// How often to poll the desktop's activity feed while the app is
// foregrounded/recently backgrounded. This is NOT true background push (see
// the note on PairingScreen) — it only fires while this interval is
// running, so it stops once RN's JS timers get suspended by the OS.
const POLL_INTERVAL_MS = 45_000;

// Activity types worth interrupting the user for — budget/usage events, per
// packages/server/src/alerts.ts. Other logged types (device_paired,
// device_revoked, subscription_added, subscription_removed — see
// packages/server/src/pairing.ts and subscriptions.ts) are informational
// CRM-style history, not alerts, so they're deliberately excluded here.
const NOTIFY_WORTHY_TITLES: Record<string, string> = {
  alert_triggered: "Budget alert",
  budget_approaching: "Approaching budget",
  period_reset: "New budget period",
};

/**
 * Polls GET /api/activity and fires a local notification for any
 * budget/usage event newer than the last one this device has seen. Pass
 * `enabled` tied to the "paired" state — there's nothing to poll before
 * that. On the very first poll after pairing (no last-seen marker yet) this
 * only records a baseline; it never floods notifications for old history.
 */
export function useActivityNotifications(enabled: boolean): void {
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function poll() {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const events = await api.activity(50);
        if (cancelled || events.length === 0) return;

        // Server orders these newest-first (see listActivity in activity.ts).
        const newest = events[0];
        const lastSeen = await getLastSeenActivity();

        if (lastSeen) {
          const newItems = events
            .filter((event) => event.id !== lastSeen.id && event.createdAt > lastSeen.createdAt)
            .reverse(); // oldest-first, so notifications land in chronological order

          for (const event of newItems) {
            const title = NOTIFY_WORTHY_TITLES[event.type];
            if (title) await notifyLocal(title, event.message);
          }
        }

        if (!cancelled) {
          await saveLastSeenActivity({ id: newest.id, createdAt: newest.createdAt });
        }
      } catch {
        // Desktop unreachable / request failed — just retry on the next tick.
      } finally {
        pollingRef.current = false;
      }
    }

    void poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled]);
}
