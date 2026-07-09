import * as SecureStore from "expo-secure-store";

export interface PairedConnection {
  host: string;
  port: number;
  token: string;
  deviceName: string;
}

const KEY = "ai-usage-hub-pairing";

export async function getPairedConnection(): Promise<PairedConnection | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PairedConnection;
  } catch {
    return null;
  }
}

export async function savePairedConnection(connection: PairedConnection): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(connection));
}

export async function clearPairedConnection(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
  // A stale last-seen marker from a previous pairing (possibly a different
  // desktop) shouldn't leak into a future pairing's notification stream.
  await clearLastSeenActivity();
}

/** Identifies the newest /api/activity item the local-notification poller has already handled. */
export interface LastSeenActivity {
  id: string;
  createdAt: string;
}

const LAST_SEEN_ACTIVITY_KEY = "ai-usage-hub-last-seen-activity";

export async function getLastSeenActivity(): Promise<LastSeenActivity | null> {
  const raw = await SecureStore.getItemAsync(LAST_SEEN_ACTIVITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LastSeenActivity;
  } catch {
    return null;
  }
}

export async function saveLastSeenActivity(activity: LastSeenActivity): Promise<void> {
  await SecureStore.setItemAsync(LAST_SEEN_ACTIVITY_KEY, JSON.stringify(activity));
}

export async function clearLastSeenActivity(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_SEEN_ACTIVITY_KEY);
}
