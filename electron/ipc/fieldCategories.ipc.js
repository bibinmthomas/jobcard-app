const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for Field Categories operations
 */
function setupFieldCategoriesIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List all field categories
  ipcMain.handle('fieldCategories:list', async () => {
    try {
      const categories = await prisma.fieldCategory.findMany({
        where: { isDeleted: false },
        include: {
          customFields: {
            where: { isDeleted: false },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });

      // Parse options JSON for custom fields
      return categories.map(category => ({
        ...category,
        customFields: category.customFields.map(field => ({
          ...field,
          options: field.options ? JSON.parse(field.options) : null,
        })),
      }));
    } catch (error) {
      console.error('Error listing field categories:', error);
      throw error;
    }
  });

  // Get a single field category
  ipcMain.handle('fieldCategories:get', async (event, id) => {
    try {
      const category = await prisma.fieldCategory.findUnique({
        where: { id },
        include: {
          customFields: {
            where: { isDeleted: false },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!category || category.isDeleted) {
        return null;
      }

      return {
        ...category,
        customFields: category.customFields.map(field => ({
          ...field,
          options: field.options ? JSON.parse(field.options) : null,
        })),
      };
    } catch (error) {
      console.error('Error getting field category:', error);
      throw error;
    }
  });

  // Create a new field category
  ipcMain.handle('fieldCategories:create', async (event, data) => {
    try {
      const category = await prisma.fieldCategory.create({
        data: {
          name: data.name,
          description: data.description,
          order: data.order || 0,
        },
        include: {
          customFields: true,
        },
      });

      return category;
    } catch (error) {
      console.error('Error creating field category:', error);
      throw error;
    }
  });

  // Update a field category
  ipcMain.handle('fieldCategories:update', async (event, { id, data }) => {
    try {
      const category = await prisma.fieldCategory.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          order: data.order,
        },
        include: {
          customFields: {
            where: { isDeleted: false },
            orderBy: { order: 'asc' },
          },
        },
      });

      return {
        ...category,
        customFields: category.customFields.map(field => ({
          ...field,
          options: field.options ? JSON.parse(field.options) : null,
        })),
      };
    } catch (error) {
      console.error('Error updating field category:', error);
      throw error;
    }
  });

  // Delete a field category (soft delete with cascade)
  ipcMain.handle('fieldCategories:delete', async (event, id) => {
    try {
      // Use transaction to ensure both category and its fields are soft-deleted together
      await prisma.$transaction(async (tx) => {
        // Soft delete all custom fields in this category
        await tx.customField.updateMany({
          where: { categoryId: id },
          data: { isDeleted: true },
        });

        // Soft delete the category itself
        await tx.fieldCategory.update({
          where: { id },
          data: { isDeleted: true },
        });
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting field category:', error);
      throw error;
    }
  });
}

module.exports = setupFieldCategoriesIPC;
