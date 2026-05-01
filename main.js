const { app, BrowserWindow, ipcMain, globalShortcut, screen, dialog } = require('electron');
const path = require('path');
const db = require('./db.js');

let mainWindow;

async function createWindow() {
  await db.initDB(app.getPath('userData'));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // frameless custom window
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Handle fullscreen toggles via global shortcuts
  globalShortcut.register('F11', () => {
    if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });
  globalShortcut.register('Escape', () => {
    if (mainWindow && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Window controls
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.on('window-toggle-fullscreen', () => {
  if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
});
ipcMain.on('window-print', () => {
  // Using default print dialog
  if (mainWindow) mainWindow.webContents.print({ silent: false, printBackground: true });
});

// DB controls
ipcMain.handle('db-query', (event, sql, params) => {
  return db.query(sql, params);
});
ipcMain.handle('db-run', (event, sql, params) => {
  return db.run(sql, params);
});
ipcMain.handle('db-insert', (event, sql, params) => {
  return db.insert(sql, params);
});
