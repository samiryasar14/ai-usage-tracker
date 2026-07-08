// Bridge between the renderer (dashboard, running as web content) and the
// main process. Two responsibilities today:
//   - openExternal: let the renderer ask the OS to open a URL in the default
//     browser (e.g. "log in" links) without granting raw shell access.
//   - onAuthCallback: deliver access/refresh tokens parsed from an
//     `ai-usage-hub://auth-callback?...` protocol launch (see main.cjs) to
//     the renderer so it can complete the login started in the browser.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  onAuthCallback: (callback) => {
    const listener = (_event, tokens) => callback(tokens);
    ipcRenderer.on("auth-callback", listener);
    return () => ipcRenderer.removeListener("auth-callback", listener);
  },
});
