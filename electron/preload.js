const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('api', {
  // Job Cards
  jobcards: {
    list: () => ipcRenderer.invoke('jobcards:list'),
    get: (id) => ipcRenderer.invoke('jobcards:get', id),
    create: (data) => ipcRenderer.invoke('jobcards:create', data),
    update: (id, data) => ipcRenderer.invoke('jobcards:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('jobcards:delete', id),
  },

  // Accounts
  accounts: {
    list: () => ipcRenderer.invoke('accounts:list'),
    get: (id) => ipcRenderer.invoke('accounts:get', id),
    create: (data) => ipcRenderer.invoke('accounts:create', data),
    update: (id, data) => ipcRenderer.invoke('accounts:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('accounts:delete', id),
  },

  // Field Categories
  fieldCategories: {
    list: () => ipcRenderer.invoke('fieldCategories:list'),
    get: (id) => ipcRenderer.invoke('fieldCategories:get', id),
    create: (data) => ipcRenderer.invoke('fieldCategories:create', data),
    update: (id, data) => ipcRenderer.invoke('fieldCategories:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('fieldCategories:delete', id),
  },

  // Custom Fields
  customFields: {
    list: () => ipcRenderer.invoke('customFields:list'),
    create: (data) => ipcRenderer.invoke('customFields:create', data),
    update: (id, data) => ipcRenderer.invoke('customFields:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('customFields:delete', id),
  },

  // Layouts
  layouts: {
    list: () => ipcRenderer.invoke('layouts:list'),
    get: (id) => ipcRenderer.invoke('layouts:get', id),
    create: (data) => ipcRenderer.invoke('layouts:create', data),
    update: (id, data) => ipcRenderer.invoke('layouts:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('layouts:delete', id),
  },

  // PDF Operations
  pdf: {
    generate: (jobCardId, layoutId) => ipcRenderer.invoke('pdf:generate', { jobCardId, layoutId }),
    import: (filePath) => ipcRenderer.invoke('pdf:import', filePath),
    export: (jobCardId, layoutId) => ipcRenderer.invoke('pdf:export', { jobCardId, layoutId }),
    getExportPath: (filename) => ipcRenderer.invoke('pdf:getExportPath', filename),
  },

  // File System
  fileSystem: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', { filePath, data }),
    selectFile: (options) => ipcRenderer.invoke('fs:selectFile', options),
    saveFile: (options) => ipcRenderer.invoke('fs:saveFile', options),
    selectFolder: (options) => ipcRenderer.invoke('fs:selectFolder', options),
  },

  // App Settings
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),
    getExportPath: () => ipcRenderer.invoke('settings:getExportPath'),
  },

  // Database Operations
  database: {
    getStats: () => ipcRenderer.invoke('database:stats'),
    clearDeleted: () => ipcRenderer.invoke('database:clearDeleted'),
    clearAll: () => ipcRenderer.invoke('database:clearAll'),
  },
});
