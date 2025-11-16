const { PrismaClient } = require('./generated/client');

let prisma;

/**
 * Get Prisma client instance (singleton pattern)
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return prisma;
}

/**
 * Close Prisma client connection
 */
async function closePrismaClient() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  getPrismaClient,
  closePrismaClient,
};
