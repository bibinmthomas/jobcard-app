const { getPrismaClient } = require('../prisma/client');
const { getCurrentSession } = require('./auth.ipc');

/**
 * Generates a job number for an account.
 * Format: PREFIX/NNNN  e.g. "ABC/0023"
 * PREFIX = first 3 chars of acctName, uppercase, alpha only.
 */
async function generateJobNo(prisma, account) {
  const prefix = account.acctName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');

  // Count all job cards (including deleted) for this account to get next seq
  const count = await prisma.jobCard.count({ where: { accountId: account.id } });
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}/${seq}`;
}

/**
 * Setup IPC handlers for JobCard operations
 */
function setupJobCardsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List all active job cards
  ipcMain.handle('jobcards:list', async () => {
    try {
      return await prisma.jobCard.findMany({
        where: { isDeleted: false, account: { isDeleted: false } },
        include: { account: true, user: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[jobcards:list] Error:', error);
      throw error;
    }
  });

  // Get a single job card
  ipcMain.handle('jobcards:get', async (event, id) => {
    try {
      const card = await prisma.jobCard.findUnique({
        where: { id },
        include: { account: true, user: { select: { id: true, username: true } } },
      });
      if (!card || card.isDeleted) return null;
      return card;
    } catch (error) {
      console.error('[jobcards:get] Error:', error);
      throw error;
    }
  });

  // Create a new job card
  ipcMain.handle('jobcards:create', async (event, data) => {
    const session = getCurrentSession();
    if (!session) throw new Error('Not authenticated');

    try {
      const account = await prisma.account.findUnique({ where: { id: data.accountId } });
      if (!account || account.isDeleted) throw new Error('Account not found or inactive');

      const jobNo = await generateJobNo(prisma, account);

      const card = await prisma.jobCard.create({
        data: {
          jobNo,
          date:              data.date            ? new Date(data.date) : new Date(),
          customer:          data.customer         || null,
          contNo:            data.contNo           || null,
          lcCNo:             data.lcCNo            || null,
          ogcNo:             data.ogcNo            || null,
          partName:          data.partName         || null,
          poNo:              data.poNo             || null,
          billNo:            data.billNo           || null,
          dwgNo:             data.dwgNo            || null,
          qty:               data.qty != null ? parseInt(data.qty, 10) : null,
          settingStartTime:  data.settingStartTime || null,
          settingEndTime:    data.settingEndTime   || null,
          settingTotalTime:  data.settingTotalTime || null,
          jobStartTime:      data.jobStartTime     || null,
          jobEndTime:        data.jobEndTime       || null,
          jobTotalTime:      data.jobTotalTime     || null,
          mcHrsStart:        data.mcHrsStart       || null,
          mcHrsEnd:          data.mcHrsEnd         || null,
          mcTotalTime:       data.mcTotalTime      || null,
          pl:                data.pl               || null,
          thickness:         data.thickness        || null,
          taper:             data.taper            || null,
          operator:          data.operator         || null,
          remark:            data.remark           || null,
          progNo:            data.progNo           || null,
          amount:            data.amount           || '0.00',
          extraFields:       data.extraFields ? JSON.stringify(data.extraFields) : null,
          accountId:         data.accountId,
          userId:            session.id,
        },
        include: { account: true, user: { select: { id: true, username: true } } },
      });

      return { ...card, extraFields: card.extraFields ? JSON.parse(card.extraFields) : {} };
    } catch (error) {
      console.error('[jobcards:create] Error:', error);
      throw error;
    }
  });

  // Update a job card
  ipcMain.handle('jobcards:update', async (event, { id, data }) => {
    const session = getCurrentSession();
    if (!session) throw new Error('Not authenticated');

    try {
      const account = await prisma.account.findUnique({ where: { id: data.accountId } });
      if (!account || account.isDeleted) throw new Error('Account not found or inactive');

      const card = await prisma.jobCard.update({
        where: { id },
        data: {
          date:              data.date            ? new Date(data.date) : undefined,
          customer:          data.customer         ?? null,
          contNo:            data.contNo           ?? null,
          lcCNo:             data.lcCNo            ?? null,
          ogcNo:             data.ogcNo            ?? null,
          partName:          data.partName         ?? null,
          poNo:              data.poNo             ?? null,
          billNo:            data.billNo           ?? null,
          dwgNo:             data.dwgNo            ?? null,
          qty:               data.qty != null ? parseInt(data.qty, 10) : null,
          settingStartTime:  data.settingStartTime ?? null,
          settingEndTime:    data.settingEndTime   ?? null,
          settingTotalTime:  data.settingTotalTime ?? null,
          jobStartTime:      data.jobStartTime     ?? null,
          jobEndTime:        data.jobEndTime       ?? null,
          jobTotalTime:      data.jobTotalTime     ?? null,
          mcHrsStart:        data.mcHrsStart       ?? null,
          mcHrsEnd:          data.mcHrsEnd         ?? null,
          mcTotalTime:       data.mcTotalTime      ?? null,
          pl:                data.pl               ?? null,
          thickness:         data.thickness        ?? null,
          taper:             data.taper            ?? null,
          operator:          data.operator         ?? null,
          remark:            data.remark           ?? null,
          progNo:            data.progNo           ?? null,
          amount:            data.amount           ?? '0.00',
          extraFields:       data.extraFields ? JSON.stringify(data.extraFields) : null,
          accountId:         data.accountId,
        },
        include: { account: true, user: { select: { id: true, username: true } } },
      });

      return { ...card, extraFields: card.extraFields ? JSON.parse(card.extraFields) : {} };
    } catch (error) {
      console.error('[jobcards:update] Error:', error);
      throw error;
    }
  });

  // Soft-delete a job card
  ipcMain.handle('jobcards:delete', async (event, id) => {
    const session = getCurrentSession();
    if (!session) throw new Error('Not authenticated');
    try {
      await prisma.jobCard.update({ where: { id }, data: { isDeleted: true } });
      return { success: true };
    } catch (error) {
      console.error('[jobcards:delete] Error:', error);
      throw error;
    }
  });
}

module.exports = setupJobCardsIPC;
