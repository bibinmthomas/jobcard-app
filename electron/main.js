const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getAppPaths } = require('./utils/paths');

// IPC handlers
const { setupAuthIPC }       = require('./ipc/auth.ipc');
const setupJobCardsIPC       = require('./ipc/jobcards.ipc');
const setupAccountsIPC       = require('./ipc/accounts.ipc');
const setupFormFieldsIPC     = require('./ipc/formFields.ipc');
const setupPdfIPC            = require('./ipc/pdf.ipc');
const setupFileSystemIPC     = require('./ipc/fileSystem.ipc');
const setupAppSettingsIPC    = require('./ipc/appSettings.ipc');
const setupDatabaseIPC       = require('./ipc/database.ipc');

let mainWindow;

function createWindow() {
  const appPaths = getAppPaths();
  console.info('[main] App paths:', appPaths);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    const port = process.env.VITE_PORT || 5173;
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

function setupIPCHandlers() {
  setupAuthIPC(ipcMain);
  setupJobCardsIPC(ipcMain);
  setupAccountsIPC(ipcMain);
  setupFormFieldsIPC(ipcMain);
  setupPdfIPC(ipcMain);
  setupFileSystemIPC(ipcMain);
  setupAppSettingsIPC(ipcMain);
  setupDatabaseIPC(ipcMain);
}

app.whenReady().then(() => {
  setupIPCHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
