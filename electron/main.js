const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getAppPaths } = require('./utils/paths');

// Import IPC handlers
const setupJobCardsIPC = require('./ipc/jobcards.ipc');
const setupCustomFieldsIPC = require('./ipc/customFields.ipc');
const setupFieldCategoriesIPC = require('./ipc/fieldCategories.ipc');
const setupLayoutsIPC = require('./ipc/layouts.ipc');
const setupPdfIPC = require('./ipc/pdf.ipc');
const setupFileSystemIPC = require('./ipc/fileSystem.ipc');
const setupAppSettingsIPC = require('./ipc/appSettings.ipc');
const setupDatabaseIPC = require('./ipc/database.ipc');
const setupAccountsIPC = require('./ipc/accounts.ipc');

let mainWindow;

function createWindow() {
  // Initialize app paths
  const appPaths = getAppPaths();
  console.log('App paths initialized:', appPaths);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.VITE_PORT || 5173;
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup all IPC handlers
function setupIPCHandlers() {
  setupJobCardsIPC(ipcMain);
  setupCustomFieldsIPC(ipcMain);
  setupFieldCategoriesIPC(ipcMain);
  setupLayoutsIPC(ipcMain);
  setupPdfIPC(ipcMain);
  setupFileSystemIPC(ipcMain);
  setupAppSettingsIPC(ipcMain);
  setupDatabaseIPC(ipcMain);
  setupAccountsIPC(ipcMain);
}

app.whenReady().then(() => {
  setupIPCHandlers();
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
