// Bridge between the renderer (dashboard, running as web content) and the
// main process — backs the "Backup Database" / "Open Data Folder" buttons in
// Settings (moved here from the now-removed native File menu).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  openDataFolder: () => ipcRenderer.invoke("open-data-folder"),
  saveOpenAIKey: (key) => ipcRenderer.invoke("save-openai-key", key),
  hasOpenAIKey: () => ipcRenderer.invoke("has-openai-key"),
  clearOpenAIKey: () => ipcRenderer.invoke("clear-openai-key"),
  showNotification: (title, body) => ipcRenderer.invoke("show-notification", title, body),
});
