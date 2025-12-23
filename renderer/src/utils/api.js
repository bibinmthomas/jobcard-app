/**
 * API layer for communicating with Electron main process
 * Uses the window.api object exposed via preload.js
 */

export const api = {
  jobcards: {
    getAll: () => window.api.jobcards.list(),
    get: (id) => window.api.jobcards.get(id),
    create: (data) => window.api.jobcards.create(data),
    update: (id, data) => window.api.jobcards.update(id, data),
    delete: (id) => window.api.jobcards.delete(id),
  },

  accounts: {
    getAll: () => window.api.accounts.list(),
    get: (id) => window.api.accounts.get(id),
    create: (data) => window.api.accounts.create(data),
    update: (id, data) => window.api.accounts.update(id, data),
    delete: (id) => window.api.accounts.delete(id),
  },

  fieldCategories: {
    getAll: () => window.api.fieldCategories.list(),
    get: (id) => window.api.fieldCategories.get(id),
    create: (data) => window.api.fieldCategories.create(data),
    update: (id, data) => window.api.fieldCategories.update(id, data),
    delete: (id) => window.api.fieldCategories.delete(id),
  },

  customFields: {
    getAll: () => window.api.customFields.list(),
    create: (data) => window.api.customFields.create(data),
    update: (id, data) => window.api.customFields.update(id, data),
    delete: (id) => window.api.customFields.delete(id),
  },

  layouts: {
    getAll: () => window.api.layouts.list(),
    get: (id) => window.api.layouts.get(id),
    create: (data) => window.api.layouts.create(data),
    update: (id, data) => window.api.layouts.update(id, data),
    delete: (id) => window.api.layouts.delete(id),
  },

  pdf: {
    generate: (jobCardId, layoutId) => window.api.pdf.generate(jobCardId, layoutId),
    import: (filePath) => window.api.pdf.import(filePath),
    export: (jobCardId, layoutId) => window.api.pdf.export(jobCardId, layoutId),
    getExportPath: (filename) => window.api.pdf.getExportPath(filename),
  },

  fileSystem: {
    readFile: (filePath) => window.api.fileSystem.readFile(filePath),
    writeFile: (filePath, data) => window.api.fileSystem.writeFile(filePath, data),
    selectFile: (options) => window.api.fileSystem.selectFile(options),
    saveFile: (options) => window.api.fileSystem.saveFile(options),
    selectFolder: (options) => window.api.fileSystem.selectFolder(options),
  },

  settings: {
    get: (key) => window.api.settings.get(key),
    getAll: () => window.api.settings.getAll(),
    set: (key, value) => window.api.settings.set(key, value),
    getExportPath: () => window.api.settings.getExportPath(),
  },

  database: {
    getStats: () => window.api.database.getStats(),
    clearDeleted: () => window.api.database.clearDeleted(),
    clearAll: () => window.api.database.clearAll(),
  },
};
