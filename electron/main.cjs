const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const isDev = !app.isPackaged;

function resolveWindowIconPath() {
  const candidates = [
    path.join(__dirname, 'assets', 'app-icon.ico'),
    path.join(process.resourcesPath, 'app.asar', 'electron', 'assets', 'app-icon.ico'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'assets', 'app-icon.ico'),
  ];

  return candidates.find((iconPath) => fs.existsSync(iconPath));
}

function createWindow() {
  const iconPath = resolveWindowIconPath();
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 680,
    autoHideMenuBar: true,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.cotepa.sat.desktop');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
