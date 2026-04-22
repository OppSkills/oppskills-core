export * from "./generated";
import { PrismaClient } from "./generated";

/**
 * Prisma singleton for Node.js (prevents exhausting DB connections in dev with hot reload).
 * Avoids `as unknown as ...` per repo TypeScript rules.
 */
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}




