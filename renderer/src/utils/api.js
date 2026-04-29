/**
 * API layer — Tauri IPC bridge.
 * All renderer code imports from here. File dialogs use @tauri-apps/plugin-dialog
 * directly; everything else goes through invoke() to the Rust backend.
 */

import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: {
    hasUsers:   ()       => invoke('auth_has_users'),
    register:   (data)   => invoke('auth_register', data),
    login:      (data)   => invoke('auth_login', data),
    logout:     ()       => invoke('auth_logout'),
    getSession: ()       => invoke('auth_get_session'),
  },

  // ── Job Cards ────────────────────────────────────────────────────────────────
  jobcards: {
    list:   ()           => invoke('jobcards_list'),
    get:    (id)         => invoke('jobcards_get', { id }),
    create: (data)       => invoke('jobcards_create', { data }),
    update: (id, data)   => invoke('jobcards_update', { id, data }),
    delete: (id)         => invoke('jobcards_delete', { id }),
  },

  // ── Accounts ─────────────────────────────────────────────────────────────────
  accounts: {
    list:   ()           => invoke('accounts_list'),
    get:    (id)         => invoke('accounts_get', { id }),
    create: (data)       => invoke('accounts_create', { data }),
    update: (id, data)   => invoke('accounts_update', { id, data }),
    delete: (id)         => invoke('accounts_delete', { id }),
  },

  // ── Form Fields ───────────────────────────────────────────────────────────────
  formFields: {
    list:   ()           => invoke('form_fields_list'),
    create: (data)       => invoke('form_fields_create', { data }),
    update: (id, data)   => invoke('form_fields_update', { id, data }),
    delete: (id)         => invoke('form_fields_delete', { id }),
  },

  // ── PDF ───────────────────────────────────────────────────────────────────────
  pdf: {
    saveToDisk: (payload) => {
      // Uint8Array → plain number array for Tauri JSON serialization
      const bytes = payload.bytes instanceof Uint8Array
        ? Array.from(payload.bytes)
        : (Array.isArray(payload.bytes) ? payload.bytes : Array.from(Object.values(payload.bytes)));
      return invoke('pdf_save_to_disk', { filename: payload.filename, bytes });
    },
    getExportDir: () => invoke('pdf_get_export_dir'),
  },

  // ── File System ───────────────────────────────────────────────────────────────
  fileSystem: {
    readFile:  (fp)       => invoke('fs_read_file',   { filePath: fp }),
    writeFile: (fp, data) => invoke('fs_write_file',  { filePath: fp, data }),

    selectFile: async (opts = {}) => {
      const result = await open({
        multiple: false,
        filters: opts.filters || [{ name: 'All Files', extensions: ['*'] }],
      });
      if (!result) return { canceled: true };
      const paths = Array.isArray(result) ? result : [result];
      return { canceled: false, filePaths: paths };
    },

    saveFile: async (opts = {}) => {
      const result = await save({
        defaultPath: opts.defaultPath,
        filters: opts.filters || [{ name: 'All Files', extensions: ['*'] }],
      });
      if (!result) return { canceled: true };
      return { canceled: false, filePath: result };
    },

    selectFolder: async (opts = {}) => {
      const result = await open({
        directory: true,
        title: opts.title || 'Select Folder',
        defaultPath: opts.defaultPath,
      });
      if (!result) return { canceled: true };
      const path = Array.isArray(result) ? result[0] : result;
      return { canceled: false, folderPath: path };
    },
  },

  // ── Settings ──────────────────────────────────────────────────────────────────
  settings: {
    get:           (key)        => invoke('settings_get',              { key }),
    getAll:        ()           => invoke('settings_get_all'),
    set:           (key, value) => invoke('settings_set',              { key, value }),
    getExportPath: ()           => invoke('settings_get_export_path'),
  },

  // ── Database ──────────────────────────────────────────────────────────────────
  database: {
    getStats:     () => invoke('db_get_stats'),
    clearDeleted: () => invoke('db_clear_deleted'),
    clearAll:     () => invoke('db_clear_all'),
  },
};
