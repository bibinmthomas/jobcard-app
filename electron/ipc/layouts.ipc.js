const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for Layout operations
 */
function setupLayoutsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List all layouts
  ipcMain.handle('layouts:list', async () => {
    try {
      const layouts = await prisma.layout.findMany({
        where: { isDeleted: false },
        include: {
          categories: {
            include: {
              category: {
                include: {
                  customFields: {
                    where: { isDeleted: false },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Parse jsonConfig and options for each layout
      return layouts.map(layout => ({
        ...layout,
        jsonConfig: layout.jsonConfig ? JSON.parse(layout.jsonConfig) : {},
        categories: layout.categories.map(lc => ({
          ...lc,
          category: {
            ...lc.category,
            customFields: lc.category.customFields.map(field => ({
              ...field,
              options: field.options ? JSON.parse(field.options) : null,
            })),
          },
        })),
      }));
    } catch (error) {
      console.error('Error listing layouts:', error);
      throw error;
    }
  });

  // Get a single layout
  ipcMain.handle('layouts:get', async (event, id) => {
    try {
      const layout = await prisma.layout.findUnique({
        where: { id },
        include: {
          categories: {
            include: {
              category: {
                include: {
                  customFields: {
                    where: { isDeleted: false },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      if (layout && !layout.isDeleted) {
        return {
          ...layout,
          jsonConfig: layout.jsonConfig ? JSON.parse(layout.jsonConfig) : {},
          categories: layout.categories.map(lc => ({
            ...lc,
            category: {
              ...lc.category,
              customFields: lc.category.customFields.map(field => ({
                ...field,
                options: field.options ? JSON.parse(field.options) : null,
              })),
            },
          })),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting layout:', error);
      throw error;
    }
  });

  // Create a new layout
  ipcMain.handle('layouts:create', async (event, data) => {
    try {
      const layout = await prisma.layout.create({
        data: {
          name: data.name,
          jsonConfig: JSON.stringify(data.jsonConfig || {}),
          categories: data.categoryIds ? {
            create: data.categoryIds.map(categoryId => ({
              categoryId: categoryId,
            })),
          } : undefined,
        },
        include: {
          categories: {
            include: {
              category: {
                include: {
                  customFields: {
                    where: { isDeleted: false },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      return {
        ...layout,
        jsonConfig: JSON.parse(layout.jsonConfig),
        categories: layout.categories.map(lc => ({
          ...lc,
          category: {
            ...lc.category,
            customFields: lc.category.customFields.map(field => ({
              ...field,
              options: field.options ? JSON.parse(field.options) : null,
            })),
          },
        })),
      };
    } catch (error) {
      console.error('Error creating layout:', error);
      throw error;
    }
  });

  // Update a layout
  ipcMain.handle('layouts:update', async (event, { id, data }) => {
    try {
      // First, delete all existing category associations
      await prisma.layoutCategory.deleteMany({
        where: { layoutId: id },
      });

      // Then update layout with new category associations
      const layout = await prisma.layout.update({
        where: { id },
        data: {
          name: data.name,
          jsonConfig: JSON.stringify(data.jsonConfig || {}),
          categories: data.categoryIds ? {
            create: data.categoryIds.map(categoryId => ({
              categoryId: categoryId,
            })),
          } : undefined,
        },
        include: {
          categories: {
            include: {
              category: {
                include: {
                  customFields: {
                    where: { isDeleted: false },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      return {
        ...layout,
        jsonConfig: JSON.parse(layout.jsonConfig),
        categories: layout.categories.map(lc => ({
          ...lc,
          category: {
            ...lc.category,
            customFields: lc.category.customFields.map(field => ({
              ...field,
              options: field.options ? JSON.parse(field.options) : null,
            })),
          },
        })),
      };
    } catch (error) {
      console.error('Error updating layout:', error);
      throw error;
    }
  });

  // Delete a layout (soft delete)
  ipcMain.handle('layouts:delete', async (event, id) => {
    try {
      await prisma.layout.update({
        where: { id },
        data: { isDeleted: true },
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting layout:', error);
      throw error;
    }
  });
}

module.exports = setupLayoutsIPC;
