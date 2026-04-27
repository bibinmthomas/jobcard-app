const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for database maintenance operations
 */
function setupDatabaseIPC(ipcMain) {
  const prisma = getPrismaClient();

  // Get database statistics
  ipcMain.handle('database:stats', async () => {
    try {
      const [
        totalJobCards, deletedJobCards,
        totalAccounts, deletedAccounts,
        totalFormFields, deletedFormFields,
        totalUsers,
      ] = await Promise.all([
        prisma.jobCard.count(),
        prisma.jobCard.count({ where: { isDeleted: true } }),
        prisma.account.count(),
        prisma.account.count({ where: { isDeleted: true } }),
        prisma.formField.count(),
        prisma.formField.count({ where: { isDeleted: true } }),
        prisma.user.count({ where: { isDeleted: false } }),
      ]);

      return {
        jobCards:   { total: totalJobCards,   active: totalJobCards   - deletedJobCards,   deleted: deletedJobCards   },
        accounts:   { total: totalAccounts,   active: totalAccounts   - deletedAccounts,   deleted: deletedAccounts   },
        formFields: { total: totalFormFields, active: totalFormFields - deletedFormFields, deleted: deletedFormFields },
        users:      { total: totalUsers },
      };
    } catch (error) {
      console.error('[database:stats] Error:', error);
      throw error;
    }
  });

  // Permanently delete all soft-deleted records
  ipcMain.handle('database:clearDeleted', async () => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const jobCards   = await tx.jobCard.deleteMany({ where: { isDeleted: true } });
        const formFields = await tx.formField.deleteMany({ where: { isDeleted: true } });
        const accounts   = await tx.account.deleteMany({ where: { isDeleted: true } });
        return {
          jobCards:   jobCards.count,
          formFields: formFields.count,
          accounts:   accounts.count,
        };
      });

      return { success: true, deleted: result };
    } catch (error) {
      console.error('[database:clearDeleted] Error:', error);
      throw error;
    }
  });

  // Delete ALL data (keep AppSettings and Users)
  ipcMain.handle('database:clearAll', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.jobCard.deleteMany({});
        await tx.formField.deleteMany({});
        await tx.account.deleteMany({});
        // Preserve: AppSettings, User
      });
      return { success: true };
    } catch (error) {
      console.error('[database:clearAll] Error:', error);
      throw error;
    }
  });
}

module.exports = setupDatabaseIPC;
