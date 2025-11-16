const { getPrismaClient } = require('../prisma/client');
const { app } = require('electron');
const path = require('path');

/**
 * Setup IPC handlers for App Settings operations
 */
function setupAppSettingsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // Get a setting by key
  ipcMain.handle('settings:get', async (event, key) => {
    try {
      const setting = await prisma.appSettings.findUnique({
        where: { key },
      });

      if (!setting) {
        // Return defaults for known settings
        const defaults = getDefaultSettings();
        return defaults[key] || null;
      }

      return {
        ...setting,
        value: JSON.parse(setting.value),
      };
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  });

  // Get all settings
  ipcMain.handle('settings:getAll', async () => {
    try {
      const settings = await prisma.appSettings.findMany();

      const defaults = getDefaultSettings();
      const settingsMap = {};

      // Add all defaults first
      Object.keys(defaults).forEach(key => {
        settingsMap[key] = defaults[key];
      });

      // Override with database values
      settings.forEach(setting => {
        settingsMap[setting.key] = {
          ...setting,
          value: JSON.parse(setting.value),
        };
      });

      return settingsMap;
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw error;
    }
  });

  // Set a setting
  ipcMain.handle('settings:set', async (event, { key, value }) => {
    try {
      const setting = await prisma.appSettings.upsert({
        where: { key },
        update: {
          value: JSON.stringify(value),
        },
        create: {
          key,
          value: JSON.stringify(value),
        },
      });

      return {
        ...setting,
        value: JSON.parse(setting.value),
      };
    } catch (error) {
      console.error('Error setting value:', error);
      throw error;
    }
  });

  // Get export path (with default)
  ipcMain.handle('settings:getExportPath', async () => {
    try {
      const setting = await prisma.appSettings.findUnique({
        where: { key: 'exportPath' },
      });

      if (!setting) {
        return path.join(app.getPath('userData'), 'pdf-exports');
      }

      return JSON.parse(setting.value);
    } catch (error) {
      console.error('Error getting export path:', error);
      throw error;
    }
  });
}

/**
 * Get default settings values
 */
function getDefaultSettings() {
  return {
    exportPath: {
      key: 'exportPath',
      value: path.join(app.getPath('userData'), 'pdf-exports'),
    },
    theme: {
      key: 'theme',
      value: 'system', // 'light', 'dark', or 'system'
    },
  };
}

module.exports = setupAppSettingsIPC;
