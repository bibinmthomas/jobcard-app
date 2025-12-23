const { getPrismaClient } = require('../prisma/client');

/**
 * Setup IPC handlers for JobCard operations
 */
function setupJobCardsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List all job cards
  ipcMain.handle('jobcards:list', async () => {
    try {
      const jobCards = await prisma.jobCard.findMany({
        where: {
          isDeleted: false,
          account: { isDeleted: false },
        },
        include: {
          layout: true,
          account: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Parse customData JSON for each job card
      return jobCards.map(card => ({
        ...card,
        customData: card.customData ? JSON.parse(card.customData) : {},
      }));
    } catch (error) {
      console.error('Error listing job cards:', error);
      throw error;
    }
  });

  // Get a single job card
  ipcMain.handle('jobcards:get', async (event, id) => {
    try {
      const jobCard = await prisma.jobCard.findUnique({
        where: { id },
        include: {
          layout: true,
          account: true,
        },
      });

      if (jobCard && !jobCard.isDeleted && jobCard.account && !jobCard.account.isDeleted) {
        return {
          ...jobCard,
          customData: jobCard.customData ? JSON.parse(jobCard.customData) : {},
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting job card:', error);
      throw error;
    }
  });

  // Create a new job card
  ipcMain.handle('jobcards:create', async (event, data) => {
    try {
      // Ensure account exists and is active
      const account = await prisma.account.findUnique({ where: { id: data.accountId } });
      if (!account || account.isDeleted) {
        throw new Error('Account not found or inactive');
      }

      const jobCard = await prisma.jobCard.create({
        data: {
          title: data.title,
          description: data.description || null,
          customData: data.customData ? JSON.stringify(data.customData) : null,
          accountId: data.accountId,
          layoutId: data.layoutId || null,
        },
        include: {
          layout: true,
          account: true,
        },
      });

      return {
        ...jobCard,
        customData: jobCard.customData ? JSON.parse(jobCard.customData) : {},
      };
    } catch (error) {
      console.error('Error creating job card:', error);
      throw error;
    }
  });

  // Update a job card
  ipcMain.handle('jobcards:update', async (event, { id, data }) => {
    try {
      // Ensure account exists and is active
      const account = await prisma.account.findUnique({ where: { id: data.accountId } });
      if (!account || account.isDeleted) {
        throw new Error('Account not found or inactive');
      }

      const jobCard = await prisma.jobCard.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          customData: data.customData ? JSON.stringify(data.customData) : null,
          layoutId: data.layoutId,
          accountId: data.accountId,
        },
        include: {
          layout: true,
          account: true,
        },
      });

      return {
        ...jobCard,
        customData: jobCard.customData ? JSON.parse(jobCard.customData) : {},
      };
    } catch (error) {
      console.error('Error updating job card:', error);
      throw error;
    }
  });

  // Delete a job card (soft delete)
  ipcMain.handle('jobcards:delete', async (event, id) => {
    try {
      await prisma.jobCard.update({
        where: { id },
        data: { isDeleted: true },
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting job card:', error);
      throw error;
    }
  });
}

module.exports = setupJobCardsIPC;
