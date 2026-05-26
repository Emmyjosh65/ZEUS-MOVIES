// -- ZEUS NETFLIX main process entry point -------------------------------
// Responsible for: window creation, streaming setup, ad-blocking,
// desktop playback, notifications and application lifecycle.
//
// Owner: EmmyJosh65
// WhatsApp: +2349066760078
// Project: ZEUS NETFLIX 🍿

const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  webContents,
  Notification,
} = require("electron");

const path = require("path");

// -- ZEUS NETFLIX Performance Flags --------------------------------------

app.commandLine.appendSwitch(
  "js-flags",
  "--max-old-space-size=256 --expose-gc",
);

app.commandLine.appendSwitch(
  "disable-features",
  "HardwareMediaKeyHandling,MediaSessionService,UseSandboxedXdgPortal",
);

app.commandLine.appendSwitch(
  "enable-features",
  "NetworkServiceInProcess2",
);

app.commandLine.appendSwitch(
  "disk-cache-size",
  String(80 * 1024 * 1024),
);

app.commandLine.appendSwitch(
  "renderer-process-limit",
  "3",
);

// -- Startup Benchmark ---------------------------------------------------

const _t0 = Date.now();

const _bench = (label) =>
  console.log(`[ZEUS BOOT] ${label}: +${Date.now() - _t0}ms`);

// -- IPC Modules ---------------------------------------------------------

const blockStats = require("./src/ipc/blockStats");
const storageIpc = require("./src/ipc/storage");
const downloadsIpc = require("./src/ipc/downloads");
const subtitlesIpc = require("./src/ipc/subtitles");
const allmangaIpc = require("./src/ipc/allmanga");
const playerIpc = require("./src/ipc/player");

// -- ZEUS NETFLIX Ad Block List -----------------------------------------

const BLOCKED_HOSTS = [
  "*://www.google-analytics.com/*",
  "*://analytics.google.com/*",
  "*://googletagmanager.com/*",
  "*://doubleclick.net/*",
  "*://pagead2.googlesyndication.com/*",
  "*://stats.g.doubleclick.net/*",
];

// -- App State -----------------------------------------------------------

let mainWindow = null;

const getMainWindow = () => mainWindow;

function createWindow() {

  mainWindow = new BrowserWindow({

    width: 1400,
    height: 900,

    minWidth: 900,
    minHeight: 600,

    backgroundColor: "#000000",

    title: "ZEUS NETFLIX 🍿",

    icon: process.platform === "linux"
      ? path.join(__dirname, "public/icon.png")
      : undefined,

    titleBarStyle:
      process.platform === "darwin"
        ? "hiddenInset"
        : "hidden",

    frame: process.platform !== "win32",

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      contextIsolation: true,

      nodeIntegration: false,

      webviewTag: true,

      backgroundThrottling: true,

      spellcheck: false,

      additionalArguments: [
        "--js-flags=--max-old-space-size=256 --expose-gc"
      ],
    },
  });

  // -- ZEUS Background Cache --------------------------------------------

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ["*://image.tmdb.org/*"] },
    (details, callback) => {

      const headers = { ...details.responseHeaders };

      headers["cache-control"] = [
        "public, max-age=604800, immutable"
      ];

      callback({ responseHeaders: headers });
    },
  );

  // -- Load Homepage -----------------------------------------------------

  mainWindow.loadFile(
    path.join(__dirname, "dist/index.html")
  );

  // -- Startup Event -----------------------------------------------------

  mainWindow.webContents.once(
    "did-finish-load",
    () => {

      _bench("ZEUS NETFLIX Loaded");

      console.log("ZEUS NETFLIX Started Successfully");
      console.log("Owner WhatsApp: +2349066760078");
    }
  );

  // -- Window Close ------------------------------------------------------

  mainWindow.on("closed", () => {

    mainWindow = null;

    app.quit();
  });
}

// -- Notifications -------------------------------------------------------

ipcMain.handle(
  "show-notification",
  (_event, { title, body, silent = false }) => {

    try {

      if (!Notification.isSupported()) return;

      const n = new Notification({
        title: String(title),
        body: String(body),
        silent,
      });

      n.show();

    } catch {}
  },
);

// -- Register IPC --------------------------------------------------------

storageIpc.register();

downloadsIpc.register(getMainWindow);

subtitlesIpc.register({
  getDownloads: downloadsIpc.getDownloads,
  saveDownloads: downloadsIpc.saveDownloads,
});

allmangaIpc.register();

playerIpc.register(getMainWindow, {
  writeSecretMigration: storageIpc.writeSecretMigration,
});

blockStats.init(getMainWindow);

// -- Single Instance Lock ------------------------------------------------

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {

  app.quit();

} else {

  app.on("second-instance", () => {

    if (mainWindow) {

      if (mainWindow.isMinimized())
        mainWindow.restore();

      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {

    _bench("ZEUS NETFLIX Ready");

    createWindow();
  });

  app.on("window-all-closed", () => app.quit());

  app.on("activate", () => {

    if (mainWindow === null)
      createWindow();
  });
}
