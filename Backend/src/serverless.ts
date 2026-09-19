import express from 'express';
import serverless from 'serverless-http';
import { createApp } from './app';
import { pathNormalize } from './middleware/pathNormalize';
import { seedAdmin } from './seed';

/**
 * Serverless entry point (Netlify Function). Wraps the same Express app used by `npm run dev` / `npm start`.
 * There is no process start to seed at, so the admin user is created lazily before the first request of each
 * warm instance (idempotent; failures are logged and retried on the next request).
 */
let seeding: Promise<void> | undefined;
function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = seedAdmin().catch((err) => {
      console.error('Admin seeding failed', err);
      seeding = undefined;
    });
  }
  return seeding;
}

const app = express();
app.use(async (_req, _res, next) => {
  await ensureSeeded();
  next();
});
app.use(pathNormalize);
app.use(createApp());

export const handler = serverless(app);
