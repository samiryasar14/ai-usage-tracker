// Bridge between the renderer (dashboard, running as web content) and the
// main process — backs the "Backup Database" / "Open Data Folder" buttons in
// Settings (moved here from the now-removed native File menu).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  openDataFolder: () => ipcRenderer.invoke("open-data-folder"),
  saveCredential: (provider, key) => ipcRenderer.invoke("save-credential", provider, key),
  hasCredential: (provider) => ipcRenderer.invoke("has-credential", provider),
  clearCredential: (provider) => ipcRenderer.invoke("clear-credential", provider),
  showNotification: (title, body) => ipcRenderer.invoke("show-notification", title, body),
});
