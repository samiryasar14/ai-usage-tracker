export {};

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      backupDatabase: () => Promise<{ ok: boolean; error: string | null }>;
      openDataFolder: () => Promise<void>;
    };
  }
}
