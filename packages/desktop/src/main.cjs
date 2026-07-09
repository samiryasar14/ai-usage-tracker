// Electron main process. Kept as plain CommonJS (rather than the TS/ESM used
// elsewhere in the monorepo) since it's a thin bootstrap shell: spawn the
// Fastify server as a child process, wait for it to accept connections, then
// point a BrowserWindow at the dashboard.
const { app, BrowserWindow, Menu, dialog, shell, ipcMain, safeStorage, Notification } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");
const fs = require("node:fs");

const SERVER_PORT = 4317;
const DASHBOARD_DEV_URL = "http://localhost:5173";

let serverProcess;
let mainWindow;

// Shared by the renderer-facing "show-notification" IPC handler and the
// autoUpdater listeners below, so the isSupported/click-to-focus dance only
// lives in one place.
function showNativeNotification(title, body) {
  if (!Notification.isSupported()) return;
  const notification = new Notification({ title, body });
  notification.on("click", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  notification.show();
}

function waitForPort(port, host, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt() {
      const socket = net.connect(port, host);
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
        } else {
          setTimeout(attempt, 300);
        }
      });
    }
    attempt();
  });
}

function packagedDbPath() {
  return path.join(app.getPath("userData"), "ai-usage-hub.db");
}

function openaiKeyPath() {
  return path.join(app.getPath("userData"), "openai-key.enc");
}

// The Fastify server runs as a plain Node child process, so it can't call
// Electron's safeStorage API itself (main-process only). Instead we decrypt the
// key here, in the main process, and hand it to the child as a plain env var at
// spawn time — same pattern as DATABASE_URL below. That means changing the key
// requires an app restart to take effect; see the "Providers" section of
// Settings in the dashboard, which says so explicitly.
function readDecryptedOpenAIKey() {
  const keyPath = openaiKeyPath();
  if (!fs.existsSync(keyPath)) return undefined;
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      console.error("OpenAI key file exists but OS-level encryption is unavailable; ignoring it.");
      return undefined;
    }
    const encrypted = fs.readFileSync(keyPath);
    const decrypted = safeStorage.decryptString(encrypted);
    return decrypted || undefined;
  } catch (err) {
    console.error("Failed to decrypt stored OpenAI key:", err);
    return undefined;
  }
}

// Dev mode: run the server straight from TS source via tsx, same as `pnpm dev:server`.
function startServerDev() {
  const serverDir = path.join(__dirname, "..", "..", "server");
  const tsxBin = path.join(serverDir, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
  serverProcess = spawn(tsxBin, ["src/index.ts"], {
    cwd: serverDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      OPENAI_ADMIN_API_KEY: readDecryptedOpenAIKey(),
    },
  });
  serverProcess.on("exit", (code) => {
    console.error(`Soar AI Tracker server exited with code ${code}`);
  });
}

// Packaged mode: no tsx/TypeScript at runtime. Run the esbuild-bundled server
// (see packages/server/build.mjs) using Electron's own binary as a plain Node
// interpreter (ELECTRON_RUN_AS_NODE), so end users don't need Node.js
// installed. Database lives in userData (not the install dir, which may not
// be writable) and is migrated on first launch — see migrate.ts.
function startServerPackaged() {
  const resourcesDir = process.resourcesPath;
  const serverEntry = path.join(resourcesDir, "server", "index.mjs");
  const migrationsDir = path.join(resourcesDir, "server", "prisma", "migrations");
  const databaseUrl = "file:" + packagedDbPath().replace(/\\/g, "/");

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: path.join(resourcesDir, "server"),
    stdio: "inherit",
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      DATABASE_URL: databaseUrl,
      RUN_APP_MIGRATIONS: "1",
      MIGRATIONS_DIR: migrationsDir,
      PORT: String(SERVER_PORT),
      OPENAI_ADMIN_API_KEY: readDecryptedOpenAIKey(),
    },
  });
  serverProcess.on("exit", (code) => {
    console.error(`Soar AI Tracker server exited with code ${code}`);
  });
}

function startServer() {
  if (app.isPackaged) startServerPackaged();
  else startServerDev();
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    title: "Soar AI Tracker",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = undefined;
  });

  if (!app.isPackaged) {
    await win.loadURL(DASHBOARD_DEV_URL);
  } else {
    await win.loadFile(path.join(process.resourcesPath, "dashboard", "index.html"));
  }
}

// Backs the "Backup Database" / "Open Data Folder" buttons in the dashboard's
// Settings tab — moved out of the native File menu (removed entirely, see
// `Menu.setApplicationMenu(null)` below) into the app's own UI instead.
ipcMain.handle("backup-database", async () => {
  const source = app.isPackaged ? packagedDbPath() : path.join(__dirname, "..", "..", "db", "dev.db");
  if (!fs.existsSync(source)) {
    return { ok: false, error: "No database file found yet." };
  }
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Backup Soar AI Tracker Database",
    defaultPath: `soar-ai-tracker-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
  });
  if (canceled || !filePath) return { ok: false, error: null };
  fs.copyFileSync(source, filePath);
  return { ok: true, error: null };
});

ipcMain.handle("open-data-folder", () => shell.openPath(app.getPath("userData")));

// Backs the "Providers" section in Settings. The renderer only ever learns
// *whether* an OpenAI key is stored (has-openai-key), never the key itself —
// save/clear are one-way. The key is encrypted at rest with Electron's
// safeStorage (OS keychain-backed) and only decrypted in this process, right
// before it's handed to the server child process as an env var (see
// readDecryptedOpenAIKey / startServerDev / startServerPackaged above).
ipcMain.handle("save-openai-key", (event, key) => {
  if (typeof key !== "string" || key.trim() === "") {
    return { ok: false, error: "No key provided." };
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: "OS-level encryption is unavailable on this machine." };
  }
  try {
    const encrypted = safeStorage.encryptString(key.trim());
    fs.writeFileSync(openaiKeyPath(), encrypted);
    return { ok: true, error: null };
  } catch (err) {
    console.error("Failed to save OpenAI key:", err);
    return { ok: false, error: "Failed to save the key." };
  }
});

ipcMain.handle("has-openai-key", () => fs.existsSync(openaiKeyPath()));

ipcMain.handle("clear-openai-key", () => {
  try {
    const keyPath = openaiKeyPath();
    if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
    return { ok: true, error: null };
  } catch (err) {
    console.error("Failed to clear OpenAI key:", err);
    return { ok: false, error: "Failed to clear the key." };
  }
});

// Backs window.electronAPI.showNotification(title, body) — used by the
// dashboard's websocket onAlert handler to surface a native OS notification.
ipcMain.handle("show-notification", (event, title, body) => {
  showNativeNotification(title, body);
});

app.whenReady().then(async () => {
  // No native File/Edit/View/Window menu bar — the app's own UI (Settings
  // tab) covers everything that menu used to expose, and a bare menu bar
  // with only default OS-provided items looks out of place next to the
  // custom-styled window chrome.
  Menu.setApplicationMenu(null);
  startServer();
  try {
    await waitForPort(SERVER_PORT, "127.0.0.1", 20_000);
  } catch (err) {
    console.error("Server did not become ready in time:", err);
    if (app.isPackaged) {
      dialog.showErrorBox(
        "Soar AI Tracker",
        "The background service didn't start in time. Try restarting the app.",
      );
    }
  }
  await createWindow();

  if (app.isPackaged) {
    // No published release exists yet at samiryasar14/ai-usage-tracker, so
    // this will just log a "no releases found" error until one is cut.
    try {
      const { autoUpdater } = require("electron-updater");
      autoUpdater.on("update-available", (info) => {
        showNativeNotification(
          "Soar AI Tracker update available",
          info && info.version ? `Version ${info.version} is downloading in the background.` : "A new version is downloading in the background.",
        );
      });
      autoUpdater.on("update-downloaded", () => {
        showNativeNotification("Update ready to install", "Restart Soar AI Tracker to apply the update.");
      });
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error("Auto-update check failed:", err);
      });
    } catch (err) {
      console.error("Auto-update unavailable:", err);
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
