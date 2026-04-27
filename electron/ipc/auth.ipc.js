const bcrypt = require('bcryptjs');
const { getPrismaClient } = require('../prisma/client');

// In-memory session — stores the logged-in user for the lifetime of the process
let currentSession = null;

/**
 * Setup IPC handlers for authentication
 */
function setupAuthIPC(ipcMain) {
  const prisma = getPrismaClient();

  // Check if any users exist (used to decide login vs signup on first launch)
  ipcMain.handle('auth:hasUsers', async () => {
    try {
      const count = await prisma.user.count({ where: { isDeleted: false } });
      return count > 0;
    } catch (error) {
      console.error('[auth:hasUsers] Error:', error);
      throw error;
    }
  });

  // Register a new user
  ipcMain.handle('auth:register', async (event, { username, password }) => {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const existing = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      });
      if (existing && !existing.isDeleted) {
        throw new Error('Username already taken');
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      // First registered user gets admin role
      const userCount = await prisma.user.count({ where: { isDeleted: false } });
      const role = userCount === 0 ? 'admin' : 'user';

      const user = await prisma.user.create({
        data: { username: trimmedUsername, password: hash, role },
      });

      currentSession = { id: user.id, username: user.username, role: user.role };
      console.info(`[auth:register] User registered: ${user.username} (${user.role})`);
      return { id: user.id, username: user.username, role: user.role };
    } catch (error) {
      console.error('[auth:register] Error:', error.message);
      throw error;
    }
  });

  // Login
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      const user = await prisma.user.findUnique({
        where: { username: username.trim() },
      });

      if (!user || user.isDeleted) {
        throw new Error('Invalid credentials');
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new Error('Invalid credentials');
      }

      currentSession = { id: user.id, username: user.username, role: user.role };
      console.info(`[auth:login] User logged in: ${user.username}`);
      return { id: user.id, username: user.username, role: user.role };
    } catch (error) {
      console.error('[auth:login] Error:', error.message);
      throw error;
    }
  });

  // Logout
  ipcMain.handle('auth:logout', async () => {
    console.info(`[auth:logout] User logged out: ${currentSession?.username}`);
    currentSession = null;
    return { success: true };
  });

  // Get current session
  ipcMain.handle('auth:getSession', async () => {
    return currentSession;
  });
}

/**
 * Returns the current session user (for use by other IPC handlers)
 */
function getCurrentSession() {
  return currentSession;
}

module.exports = { setupAuthIPC, getCurrentSession };
