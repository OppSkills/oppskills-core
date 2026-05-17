/**
 * Nest dev (`nest start --watch`) plus several deps (BullMQ, Prisma, New Relic,
 * Winston, etc.) each register `process` handlers for `uncaughtException` /
 * `unhandledRejection`. Node's default max (10) then triggers a misleading
 * "memory leak" warning. Raising the cap in non-production avoids noisy dev logs
 * without hiding real leaks in app code (we don't add raw process listeners).
 *
 * This file must be imported first from `main.ts` so it runs before other modules.
 */
if (process.env.NODE_ENV !== 'production') {
  process.setMaxListeners(50);
}
