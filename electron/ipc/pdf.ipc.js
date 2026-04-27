const path = require('path');
const fs   = require('fs');
const { app } = require('electron');
const { getPrismaClient } = require('../prisma/client');
const { getCurrentSession } = require('./auth.ipc');

/**
 * Setup IPC handlers for PDF operations.
 * PDF generation happens in the renderer using @react-pdf/renderer.
 * This module handles saving the resulting bytes to disk.
 */
function setupPdfIPC(ipcMain) {
  const prisma = getPrismaClient();

  /**
   * Resolves the export directory. Falls back to <documents>/JobCardExports.
   */
  async function resolveExportDir() {
    try {
      const setting = await prisma.appSettings.findUnique({
        where: { key: 'exportPath' },
      });
      if (setting && setting.value) {
        const p = JSON.parse(setting.value);
        if (p && typeof p === 'string') return p;
      }
    } catch {
      // fall through to default
    }
    return path.join(app.getPath('documents'), 'JobCardExports');
  }

  // Save PDF bytes sent from renderer to the configured export directory
  ipcMain.handle('pdf:saveToDisk', async (event, { filename, bytes }) => {
    if (!getCurrentSession()) throw new Error('Not authenticated');

    try {
      const exportDir = await resolveExportDir();
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filePath = path.join(exportDir, filename);
      fs.writeFileSync(filePath, Buffer.from(bytes));

      console.info(`[pdf:saveToDisk] Saved: ${filePath}`);
      return { success: true, path: filePath };
    } catch (error) {
      console.error('[pdf:saveToDisk] Error:', error);
      throw error;
    }
  });

  // Return the resolved export directory path
  ipcMain.handle('pdf:getExportDir', async () => {
    try {
      return await resolveExportDir();
    } catch (error) {
      console.error('[pdf:getExportDir] Error:', error);
      throw error;
    }
  });
}

module.exports = setupPdfIPC;
