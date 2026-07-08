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
}
