const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods to the renderer process via window.api
 * contextIsolation ensures the renderer cannot access Node.js directly.
 */
contextBridge.exposeInMainWorld('api', {

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    hasUsers:   ()       => ipcRenderer.invoke('auth:hasUsers'),
    register:   (data)   => ipcRenderer.invoke('auth:register', data),
    login:      (data)   => ipcRenderer.invoke('auth:login',    data),
    logout:     ()       => ipcRenderer.invoke('auth:logout'),
    getSession: ()       => ipcRenderer.invoke('auth:getSession'),
  },

  // ── Job Cards ─────────────────────────────────────────────────────────────
  jobcards: {
    list:   ()           => ipcRenderer.invoke('jobcards:list'),
    get:    (id)         => ipcRenderer.invoke('jobcards:get',    id),
    create: (data)       => ipcRenderer.invoke('jobcards:create', data),
    update: (id, data)   => ipcRenderer.invoke('jobcards:update', { id, data }),
    delete: (id)         => ipcRenderer.invoke('jobcards:delete', id),
  },

  // ── Accounts ──────────────────────────────────────────────────────────────
  accounts: {
    list:   ()           => ipcRenderer.invoke('accounts:list'),
    get:    (id)         => ipcRenderer.invoke('accounts:get',    id),
    create: (data)       => ipcRenderer.invoke('accounts:create', data),
    update: (id, data)   => ipcRenderer.invoke('accounts:update', { id, data }),
    delete: (id)         => ipcRenderer.invoke('accounts:delete', id),
  },

  // ── Form Fields (settings-defined extra fields) ───────────────────────────
  formFields: {
    list:   ()           => ipcRenderer.invoke('formFields:list'),
    create: (data)       => ipcRenderer.invoke('formFields:create', data),
    update: (id, data)   => ipcRenderer.invoke('formFields:update', { id, data }),
    delete: (id)         => ipcRenderer.invoke('formFields:delete', id),
  },

  // ── PDF ───────────────────────────────────────────────────────────────────
  pdf: {
    saveToDisk:   (payload)  => ipcRenderer.invoke('pdf:saveToDisk',  payload),
    getExportDir: ()         => ipcRenderer.invoke('pdf:getExportDir'),
  },

  // ── File System ───────────────────────────────────────────────────────────
  fileSystem: {
    readFile:     (filePath) => ipcRenderer.invoke('fs:readFile',   filePath),
    writeFile:    (fp, data) => ipcRenderer.invoke('fs:writeFile',  { filePath: fp, data }),
    selectFile:   (options)  => ipcRenderer.invoke('fs:selectFile', options),
    saveFile:     (options)  => ipcRenderer.invoke('fs:saveFile',   options),
    selectFolder: (options)  => ipcRenderer.invoke('fs:selectFolder', options),
  },

  // ── App Settings ──────────────────────────────────────────────────────────
  settings: {
    get:           (key)        => ipcRenderer.invoke('settings:get',        key),
    getAll:        ()           => ipcRenderer.invoke('settings:getAll'),
    set:           (key, value) => ipcRenderer.invoke('settings:set',        { key, value }),
    getExportPath: ()           => ipcRenderer.invoke('settings:getExportPath'),
  },

  // ── Database ──────────────────────────────────────────────────────────────
  database: {
    getStats:     () => ipcRenderer.invoke('database:stats'),
    clearDeleted: () => ipcRenderer.invoke('database:clearDeleted'),
    clearAll:     () => ipcRenderer.invoke('database:clearAll'),
  },
});
