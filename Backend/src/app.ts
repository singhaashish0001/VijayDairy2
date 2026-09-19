import cors from 'cors';
import express from 'express';
import { config } from './config';
import { requireAuth } from './middleware/auth';
import { camelizeBody, errorHandler } from './middleware/common';
import { authRouter } from './routes/auth';
import { dashboardRouter } from './routes/dashboard';
import { invoicesRouter } from './routes/invoices';
import { productsRouter } from './routes/products';
import { publicRouter } from './routes/public';
import { settingsRouter } from './routes/settings';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json());
  app.use(camelizeBody);

  // Anonymous: login (guarded per-route inside authRouter) and the public invoice share link.
  app.use('/api/auth', authRouter);
  app.use('/api/public', publicRouter);

  // Everything else requires a valid JWT.
  app.use('/api/products', requireAuth, productsRouter);
  app.use('/api/invoices', requireAuth, invoicesRouter);
  app.use('/api/settings', requireAuth, settingsRouter);
  app.use('/api/dashboard', requireAuth, dashboardRouter);

  app.use(errorHandler);
  return app;
}
