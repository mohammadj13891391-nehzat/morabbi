import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined; prismaSchemaVersion?: string }
const SCHEMA_VERSION = "v17-methodology"
if (globalForPrisma.prisma && globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION) {
  try { globalForPrisma.prisma.$disconnect(); } catch {}
  globalForPrisma.prisma = undefined;
}
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error', 'warn'] })
globalForPrisma.prisma = db
globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
