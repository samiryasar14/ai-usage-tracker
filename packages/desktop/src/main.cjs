// Electron main process. Kept as plain CommonJS (rather than the TS/ESM used
// elsewhere in the monorepo) since it's a thin bootstrap shell: spawn the
// Fastify server as a child process, wait for it to accept connections, then
// point a BrowserWindow at the dashboard.
const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");
const fs = require("node:fs");

const SERVER_PORT = 4317;
const DASHBOARD_DEV_URL = "http://localhost:5173";

let serverProcess;

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

// Dev mode: run the server straight from TS source via tsx, same as `pnpm dev:server`.
function startServerDev() {
  const serverDir = path.join(__dirname, "..", "..", "server");
  const tsxBin = path.join(serverDir, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
  serverProcess = spawn(tsxBin, ["src/index.ts"], {
    cwd: serverDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  serverProcess.on("exit", (code) => {
    console.error(`AI Usage Hub server exited with code ${code}`);
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
    },
  });
  serverProcess.on("exit", (code) => {
    console.error(`AI Usage Hub server exited with code ${code}`);
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
    title: "AI Usage Hub",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
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
    title: "Backup AI Usage Hub Database",
    defaultPath: `ai-usage-hub-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
  });
  if (canceled || !filePath) return { ok: false, error: null };
  fs.copyFileSync(source, filePath);
  return { ok: true, error: null };
});

ipcMain.handle("open-data-folder", () => shell.openPath(app.getPath("userData")));

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
        "AI Usage Hub",
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
