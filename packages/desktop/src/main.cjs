// Electron main process. Kept as plain CommonJS (rather than the TS/ESM used
// elsewhere in the monorepo) since it's a thin bootstrap shell: spawn the
// Fastify server as a child process, wait for it to accept connections, then
// point a BrowserWindow at the dashboard.
const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");

const SERVER_DIR = path.join(__dirname, "..", "..", "server");
const SERVER_PORT = 4317;
const DASHBOARD_DEV_URL = "http://localhost:5173";
const DASHBOARD_BUILD_INDEX = path.join(__dirname, "..", "..", "dashboard", "dist", "index.html");

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

function startServer() {
  const tsxBin = path.join(
    SERVER_DIR,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsx.cmd" : "tsx",
  );
  serverProcess = spawn(tsxBin, ["src/index.ts"], {
    cwd: SERVER_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  serverProcess.on("exit", (code) => {
    console.error(`AI Usage Hub server exited with code ${code}`);
  });
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
    await win.loadFile(DASHBOARD_BUILD_INDEX);
  }
}

app.whenReady().then(async () => {
  startServer();
  try {
    await waitForPort(SERVER_PORT, "127.0.0.1", 20_000);
  } catch (err) {
    console.error("Server did not become ready in time:", err);
  }
  await createWindow();

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
