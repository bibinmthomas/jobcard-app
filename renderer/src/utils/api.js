/**
 * API layer — thin wrapper over window.api (exposed by preload.js via contextBridge).
 * All renderer code should import from here rather than calling window.api directly.
 */

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: {
    hasUsers:   ()       => window.api.auth.hasUsers(),
    register:   (data)   => window.api.auth.register(data),
    login:      (data)   => window.api.auth.login(data),
    logout:     ()       => window.api.auth.logout(),
    getSession: ()       => window.api.auth.getSession(),
  },

  // ── Job Cards ────────────────────────────────────────────────────────────────
  jobcards: {
    list:   ()           => window.api.jobcards.list(),
    get:    (id)         => window.api.jobcards.get(id),
    create: (data)       => window.api.jobcards.create(data),
    update: (id, data)   => window.api.jobcards.update(id, data),
    delete: (id)         => window.api.jobcards.delete(id),
  },

  // ── Accounts ─────────────────────────────────────────────────────────────────
  accounts: {
    list:   ()           => window.api.accounts.list(),
    get:    (id)         => window.api.accounts.get(id),
    create: (data)       => window.api.accounts.create(data),
    update: (id, data)   => window.api.accounts.update(id, data),
    delete: (id)         => window.api.accounts.delete(id),
  },

  // ── Form Fields ───────────────────────────────────────────────────────────────
  formFields: {
    list:   ()           => window.api.formFields.list(),
    create: (data)       => window.api.formFields.create(data),
    update: (id, data)   => window.api.formFields.update(id, data),
    delete: (id)         => window.api.formFields.delete(id),
  },

  // ── PDF ───────────────────────────────────────────────────────────────────────
  pdf: {
    saveToDisk:   (payload) => window.api.pdf.saveToDisk(payload),
    getExportDir: ()        => window.api.pdf.getExportDir(),
  },

  // ── File System ───────────────────────────────────────────────────────────────
  fileSystem: {
    readFile:     (fp)      => window.api.fileSystem.readFile(fp),
    writeFile:    (fp, data)=> window.api.fileSystem.writeFile(fp, data),
    selectFile:   (opts)    => window.api.fileSystem.selectFile(opts),
    saveFile:     (opts)    => window.api.fileSystem.saveFile(opts),
    selectFolder: (opts)    => window.api.fileSystem.selectFolder(opts),
  },

  // ── Settings ──────────────────────────────────────────────────────────────────
  settings: {
    get:           (key)        => window.api.settings.get(key),
    getAll:        ()           => window.api.settings.getAll(),
    set:           (key, value) => window.api.settings.set(key, value),
    getExportPath: ()           => window.api.settings.getExportPath(),
  },

  // ── Database ──────────────────────────────────────────────────────────────────
  database: {
    getStats:     () => window.api.database.getStats(),
    clearDeleted: () => window.api.database.clearDeleted(),
    clearAll:     () => window.api.database.clearAll(),
  },
};
