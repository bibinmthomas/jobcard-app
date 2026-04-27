const { getPrismaClient } = require('../prisma/client');
const { getCurrentSession } = require('./auth.ipc');

/**
 * Setup IPC handlers for Account operations
 */
function setupAccountsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List all active accounts
  ipcMain.handle('accounts:list', async () => {
    try {
      return await prisma.account.findMany({
        where: { isDeleted: false },
        orderBy: { acctName: 'asc' },
      });
    } catch (error) {
      console.error('[accounts:list] Error:', error);
      throw error;
    }
  });

  // Get a single account
  ipcMain.handle('accounts:get', async (event, id) => {
    try {
      const account = await prisma.account.findUnique({ where: { id } });
      if (!account || account.isDeleted) return null;
      return account;
    } catch (error) {
      console.error('[accounts:get] Error:', error);
      throw error;
    }
  });

  // Create account
  ipcMain.handle('accounts:create', async (event, data) => {
    if (!getCurrentSession()) throw new Error('Not authenticated');
    try {
      if (!data.acctName || !data.acctName.trim()) {
        throw new Error('Account name is required');
      }

      return await prisma.account.create({
        data: {
          acctName:      data.acctName.trim(),
          address:       data.address       || null,
          city:          data.city          || null,
          pin:           data.pin           || null,
          fax:           data.fax           || null,
          telex:         data.telex         || null,
          contactPerson: data.contactPerson || null,
        },
      });
    } catch (error) {
      console.error('[accounts:create] Error:', error);
      throw error;
    }
  });

  // Update account
  ipcMain.handle('accounts:update', async (event, { id, data }) => {
    if (!getCurrentSession()) throw new Error('Not authenticated');
    try {
      if (!data.acctName || !data.acctName.trim()) {
        throw new Error('Account name is required');
      }

      return await prisma.account.update({
        where: { id },
        data: {
          acctName:      data.acctName.trim(),
          address:       data.address       || null,
          city:          data.city          || null,
          pin:           data.pin           || null,
          fax:           data.fax           || null,
          telex:         data.telex         || null,
          contactPerson: data.contactPerson || null,
        },
      });
    } catch (error) {
      console.error('[accounts:update] Error:', error);
      throw error;
    }
  });

  // Soft-delete account — blocked if it has active job cards
  ipcMain.handle('accounts:delete', async (event, id) => {
    if (!getCurrentSession()) throw new Error('Not authenticated');
    try {
      const jobCardCount = await prisma.jobCard.count({
        where: { accountId: id, isDeleted: false },
      });
      if (jobCardCount > 0) {
        throw new Error('Cannot delete an account that has active job cards');
      }

      await prisma.account.update({
        where: { id },
        data: { isDeleted: true },
      });

      return { success: true };
    } catch (error) {
      console.error('[accounts:delete] Error:', error);
      throw error;
    }
  });
}

module.exports = setupAccountsIPC;
