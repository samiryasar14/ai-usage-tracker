export {};

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      openExternal: (url: string) => Promise<void>;
      onAuthCallback: (callback: (tokens: { accessToken: string; refreshToken: string }) => void) => () => void;
    };
  }
}
