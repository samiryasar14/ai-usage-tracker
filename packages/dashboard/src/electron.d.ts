export {};

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      backupDatabase: () => Promise<{ ok: boolean; error: string | null }>;
      openDataFolder: () => Promise<void>;
      saveOpenAIKey: (key: string) => Promise<{ ok: boolean; error: string | null }>;
      hasOpenAIKey: () => Promise<boolean>;
      clearOpenAIKey: () => Promise<{ ok: boolean; error: string | null }>;
    };
  }
}
