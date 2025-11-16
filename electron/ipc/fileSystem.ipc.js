const { dialog } = require('electron');
const fs = require('fs').promises;

/**
 * Setup IPC handlers for File System operations
 */
function setupFileSystemIPC(ipcMain) {
  // Read file
  ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath);
      return {
        success: true,
        data: data.toString('base64'),
      };
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  // Write file
  ipcMain.handle('fs:writeFile', async (event, { filePath, data }) => {
    try {
      // If data is base64, decode it
      const buffer = Buffer.from(data, 'base64');
      await fs.writeFile(filePath, buffer);
      return { success: true };
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  // Select file dialog
  ipcMain.handle('fs:selectFile', async (event, options = {}) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled) {
        return { canceled: true };
      }

      return {
        canceled: false,
        filePaths: result.filePaths,
      };
    } catch (error) {
      console.error('Error selecting file:', error);
      throw error;
    }
  });

  // Save file dialog
  ipcMain.handle('fs:saveFile', async (event, options = {}) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: options.defaultPath,
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled) {
        return { canceled: true };
      }

      return {
        canceled: false,
        filePath: result.filePath,
      };
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  });

  // Select folder dialog
  ipcMain.handle('fs:selectFolder', async (event, options = {}) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: options.title || 'Select Folder',
        defaultPath: options.defaultPath,
      });

      if (result.canceled) {
        return { canceled: true };
      }

      return {
        canceled: false,
        folderPath: result.filePaths[0],
      };
    } catch (error) {
      console.error('Error selecting folder:', error);
      throw error;
    }
  });
}

module.exports = setupFileSystemIPC;
