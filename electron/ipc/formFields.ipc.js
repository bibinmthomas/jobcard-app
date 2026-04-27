const { getPrismaClient } = require('../prisma/client');
const { getCurrentSession } = require('./auth.ipc');

const VALID_TYPES = ['string', 'number', 'date', 'multiselect'];

/**
 * Setup IPC handlers for FormField operations (settings-defined extra fields)
 */
function setupFormFieldsIPC(ipcMain) {
  const prisma = getPrismaClient();

  // List all active form fields ordered by display order
  ipcMain.handle('formFields:list', async () => {
    try {
      return await prisma.formField.findMany({
        where: { isDeleted: false },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      console.error('[formFields:list] Error:', error);
      throw error;
    }
  });

  // Create a form field
  ipcMain.handle('formFields:create', async (event, data) => {
    if (!getCurrentSession()) throw new Error('Not authenticated');
    try {
      if (!data.name || !data.name.trim()) throw new Error('Field name is required');
      if (!data.label || !data.label.trim()) throw new Error('Field label is required');
      if (!VALID_TYPES.includes(data.type)) {
        throw new Error(`Invalid field type. Must be one of: ${VALID_TYPES.join(', ')}`);
      }
      if (data.type === 'multiselect') {
        const opts = Array.isArray(data.options) ? data.options : [];
        if (opts.length === 0) throw new Error('Multiselect fields require at least one option');
      }

      return await prisma.formField.create({
        data: {
          name:     data.name.trim().replace(/\s+/g, '_').toLowerCase(),
          label:    data.label.trim(),
          type:     data.type,
          options:  data.type === 'multiselect' && data.options
            ? JSON.stringify(data.options)
            : null,
          required: Boolean(data.required),
          order:    data.order ?? 0,
        },
      });
    } catch (error) {
      console.error('[formFields:create] Error:', error);
      throw error;
    }
  });

  // Update a form field
  ipcMain.handle('formFields:update', async (event, { id, data }) => {
    if (!getCurrentSession()) throw new Error('Not authenticated');
    try {
      if (data.type && !VALID_TYPES.includes(data.type)) {
        throw new Error(`Invalid field type. Must be one of: ${VALID_TYPES.join(', ')}`);
      }

      return await prisma.formField.update({
        where: { id },
        data: {
          label:    data.label?.trim(),
          type:     data.type,
          options:  data.type === 'multiselect' && data.options
            ? JSON.stringify(data.options)
            : null,
          required: data.required != null ? Boolean(data.required) : undefined,
          order:    data.order,
        },
      });
    } catch (error) {
      console.error('[formFields:update] Error:', error);
      throw error;
    }
  });

  // Soft-delete a form field
  ipcMain.handle('formFields:delete', async (event, id) => {
    if (!getCurrentSession()) throw new Error('Not authenticated');
    try {
      await prisma.formField.update({ where: { id }, data: { isDeleted: true } });
      return { success: true };
    } catch (error) {
      console.error('[formFields:delete] Error:', error);
      throw error;
    }
  });
}

module.exports = setupFormFieldsIPC;
