import { Router } from 'express';
import { ok } from '../envelope';
import { getDashboardStats } from '../services/dashboardService';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (_req, res) => {
  res.json(ok(await getDashboardStats()));
});
