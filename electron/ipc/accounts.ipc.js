const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for Account operations
 */
function setupAccountsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List accounts
  ipcMain.handle('accounts:list', async () => {
    try {
      return await prisma.account.findMany({
        where: { isDeleted: false },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('Error listing accounts:', error);
      throw error;
    }
  });

  // Get account
  ipcMain.handle('accounts:get', async (event, id) => {
    try {
      const account = await prisma.account.findUnique({ where: { id } });
      if (!account || account.isDeleted) return null;
      return account;
    } catch (error) {
      console.error('Error getting account:', error);
      throw error;
    }
  });

  // Create account
  ipcMain.handle('accounts:create', async (event, data) => {
    try {
      return await prisma.account.create({
        data: {
          name: data.name,
          address: data.address,
          city: data.city,
          pin: data.pin,
          telephone: data.telephone,
          fax: data.fax || null,
          telex: data.telex || null,
          contactPerson: data.contactPerson || null,
        },
      });
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  });

  // Update account
  ipcMain.handle('accounts:update', async (event, { id, data }) => {
    try {
      return await prisma.account.update({
        where: { id },
        data: {
          name: data.name,
          address: data.address,
          city: data.city,
          pin: data.pin,
          telephone: data.telephone,
          fax: data.fax || null,
          telex: data.telex || null,
          contactPerson: data.contactPerson || null,
        },
      });
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  });

  // Soft delete account (only if no active job cards)
  ipcMain.handle('accounts:delete', async (event, id) => {
    try {
      const jobCardCount = await prisma.jobCard.count({
        where: { accountId: id, isDeleted: false },
      });

      if (jobCardCount > 0) {
        throw new Error('Cannot delete account with active job cards');
      }

      await prisma.account.update({
        where: { id },
        data: { isDeleted: true },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  });
}

module.exports = setupAccountsIPC;
