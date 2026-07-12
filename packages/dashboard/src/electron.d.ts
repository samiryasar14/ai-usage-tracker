export {};

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      backupDatabase: () => Promise<{ ok: boolean; error: string | null }>;
      openDataFolder: () => Promise<void>;
      saveCredential: (provider: string, key: string) => Promise<{ ok: boolean; error: string | null }>;
      hasCredential: (provider: string) => Promise<boolean>;
      clearCredential: (provider: string) => Promise<{ ok: boolean; error: string | null }>;
      showNotification: (title: string, body: string) => Promise<void>;
    };
  }
}
