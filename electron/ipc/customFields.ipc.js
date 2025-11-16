const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for Custom Fields operations
 */
function setupCustomFieldsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List all custom fields
  ipcMain.handle('customFields:list', async () => {
    try {
      const fields = await prisma.customField.findMany({
        where: { isDeleted: false },
        include: {
          category: true,
        },
        orderBy: { order: 'asc' },
      });

      // Parse options JSON for each field
      return fields.map(field => ({
        ...field,
        options: field.options ? JSON.parse(field.options) : null,
      }));
    } catch (error) {
      console.error('Error listing custom fields:', error);
      throw error;
    }
  });

  // Create a new custom field
  ipcMain.handle('customFields:create', async (event, data) => {
    try {
      const field = await prisma.customField.create({
        data: {
          name: data.name,
          type: data.type,
          options: data.options ? JSON.stringify(data.options) : null,
          required: data.required || false,
          order: data.order || 0,
          categoryId: data.categoryId,
        },
        include: {
          category: true,
        },
      });

      return {
        ...field,
        options: field.options ? JSON.parse(field.options) : null,
      };
    } catch (error) {
      console.error('Error creating custom field:', error);
      throw error;
    }
  });

  // Update a custom field
  ipcMain.handle('customFields:update', async (event, { id, data }) => {
    try {
      const field = await prisma.customField.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          options: data.options ? JSON.stringify(data.options) : null,
          required: data.required,
          order: data.order,
        },
      });

      return {
        ...field,
        options: field.options ? JSON.parse(field.options) : null,
      };
    } catch (error) {
      console.error('Error updating custom field:', error);
      throw error;
    }
  });

  // Delete a custom field (soft delete)
  ipcMain.handle('customFields:delete', async (event, id) => {
    try {
      await prisma.customField.update({
        where: { id },
        data: { isDeleted: true },
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting custom field:', error);
      throw error;
    }
  });
}

module.exports = setupCustomFieldsIPC;
