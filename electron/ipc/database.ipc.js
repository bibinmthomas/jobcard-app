const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for Database operations
 */
function setupDatabaseIPC(ipcMain) {
  const prisma = getPrismaClient();

  // Get database statistics
  ipcMain.handle('database:stats', async () => {
    try {
      const [
        totalJobCards,
        deletedJobCards,
        totalLayouts,
        deletedLayouts,
        totalCategories,
        deletedCategories,
        totalCustomFields,
        deletedCustomFields,
        totalAccounts,
        deletedAccounts,
      ] = await Promise.all([
        prisma.jobCard.count(),
        prisma.jobCard.count({ where: { isDeleted: true } }),
        prisma.layout.count(),
        prisma.layout.count({ where: { isDeleted: true } }),
        prisma.fieldCategory.count(),
        prisma.fieldCategory.count({ where: { isDeleted: true } }),
        prisma.customField.count(),
        prisma.customField.count({ where: { isDeleted: true } }),
        prisma.account.count(),
        prisma.account.count({ where: { isDeleted: true } }),
      ]);

      return {
        jobCards: {
          total: totalJobCards,
          active: totalJobCards - deletedJobCards,
          deleted: deletedJobCards,
        },
        layouts: {
          total: totalLayouts,
          active: totalLayouts - deletedLayouts,
          deleted: deletedLayouts,
        },
        categories: {
          total: totalCategories,
          active: totalCategories - deletedCategories,
          deleted: deletedCategories,
        },
        customFields: {
          total: totalCustomFields,
          active: totalCustomFields - deletedCustomFields,
          deleted: deletedCustomFields,
        },
        accounts: {
          total: totalAccounts,
          active: totalAccounts - deletedAccounts,
          deleted: deletedAccounts,
        },
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  });

  // Clear all soft-deleted records (empty recycle bin)
  ipcMain.handle('database:clearDeleted', async () => {
    try {
      // First, get IDs of deleted layouts and categories to clean up junction table
      const deletedLayoutIds = (await prisma.layout.findMany({
        where: { isDeleted: true },
        select: { id: true }
      })).map(l => l.id);

      const deletedCategoryIds = (await prisma.fieldCategory.findMany({
        where: { isDeleted: true },
        select: { id: true }
      })).map(c => c.id);

      const result = await prisma.$transaction(async (tx) => {
        // Delete in correct order to respect foreign key constraints

        // 1. Delete layout-category associations for deleted layouts or categories
        const layoutCategories = await tx.layoutCategory.deleteMany({
          where: {
            OR: [
              { layoutId: { in: deletedLayoutIds } },
              { categoryId: { in: deletedCategoryIds } },
            ],
          },
        });

        // 2. Delete job cards (they reference layouts, but layouts aren't deleted yet)
        const jobCards = await tx.jobCard.deleteMany({
          where: { isDeleted: true }
        });

        // 3. Delete custom fields (they reference categories, but categories aren't deleted yet)
        const customFields = await tx.customField.deleteMany({
          where: { isDeleted: true }
        });

        // 4. Delete layouts (now safe, no job cards or layout-categories reference them)
        const layouts = await tx.layout.deleteMany({
          where: { isDeleted: true }
        });

        // 5. Delete accounts (only soft-deleted ones)
        const accounts = await tx.account.deleteMany({
          where: { isDeleted: true }
        });

        // 6. Finally, delete categories (now safe, no custom fields or layout-categories reference them)
        const categories = await tx.fieldCategory.deleteMany({
          where: { isDeleted: true }
        });

        return {
          jobCards: jobCards.count,
          layouts: layouts.count,
          categories: categories.count,
          customFields: customFields.count,
          layoutCategories: layoutCategories.count,
          accounts: accounts.count,
        };
      });

      return { success: true, deleted: result };
    } catch (error) {
      console.error('Error clearing deleted records:', error);
      throw error;
    }
  });

  // Clear ALL database data (reset)
  ipcMain.handle('database:clearAll', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete in correct order to respect foreign key constraints
        await tx.layoutCategory.deleteMany({});
        await tx.customField.deleteMany({});
        await tx.jobCard.deleteMany({});
        await tx.layout.deleteMany({});
        await tx.fieldCategory.deleteMany({});
        await tx.account.deleteMany({});
        // Keep AppSettings as they're configuration
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing all database data:', error);
      throw error;
    }
  });
}

module.exports = setupDatabaseIPC;
