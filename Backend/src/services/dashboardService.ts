import { roundHalfAwayFromZero, round2 } from '../numbers';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { productRepository } from '../repositories/productRepository';
import { settingsRepository } from '../repositories/settingsRepository';
import type { Invoice } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');
const sum = (invoices: Invoice[]) => invoices.reduce((s, i) => s + i.total, 0);

/**
 * Same semantics as the .NET handler: aggregates over the latest 1000 invoices (in memory), all periods in UTC,
 * weeks starting on Monday.
 */
export async function getDashboardStats(now: Date = new Date()) {
  const invoices = await invoiceRepository.getAll();
  const settings = await settingsRepository.get();

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const diffToMonday = (now.getUTCDay() + 6) % 7;
  const weekStart = today - diffToMonday * DAY_MS;
  const prevWeekStart = weekStart - 7 * DAY_MS;

  const between = (from: number, to = Infinity) =>
    invoices.filter((i) => i.createdAt.getTime() >= from && i.createdAt.getTime() < to);

  const totalRevenue = sum(invoices);
  const monthRevenue = sum(between(monthStart));
  const todayRevenue = sum(between(today));
  const weekRevenue = sum(between(weekStart));
  const prevWeekRevenue = sum(between(prevWeekStart, weekStart));

  const wowChange =
    prevWeekRevenue === 0
      ? weekRevenue > 0
        ? 100
        : 0
      : round2(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100);

  const monthlySeries = [];
  for (let i = 11; i >= 0; i--) {
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
    const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1);
    const d = new Date(start);
    monthlySeries.push({ month: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`, revenue: round2(sum(between(start, end))) });
  }

  const dailySeries = [];
  for (let i = 29; i >= 0; i--) {
    const start = today - i * DAY_MS;
    const d = new Date(start);
    dailySeries.push({
      date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      revenue: round2(sum(between(start, start + DAY_MS))),
    });
  }

  const allItems = invoices.flatMap((i) => i.items);

  const byName = new Map<string, { quantity: number; revenue: number }>();
  const byUnit = new Map<string, number>();
  for (const item of allItems) {
    const p = byName.get(item.name) ?? { quantity: 0, revenue: 0 };
    p.quantity += item.quantity;
    p.revenue += item.total;
    byName.set(item.name, p);
    byUnit.set(item.unit, (byUnit.get(item.unit) ?? 0) + item.total);
  }

  const topProducts = [...byName.entries()]
    .map(([name, p]) => ({ name, quantity: roundHalfAwayFromZero(p.quantity, 3), revenue: round2(p.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const salesByUnit = [...byUnit.entries()]
    .map(([unit, revenue]) => ({ unit, revenue: round2(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  const recentInvoices = invoices.slice(0, 5).map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    total: i.total,
    itemsCount: i.items.length,
    createdAt: i.createdAt,
  }));

  const lowStockProducts = settings.inventoryEnabled
    ? (await productRepository.getLowStock(10)).map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        unit: p.unit,
      }))
    : [];

  return {
    totalRevenue: round2(totalRevenue),
    monthRevenue: round2(monthRevenue),
    todayRevenue: round2(todayRevenue),
    weekRevenue: round2(weekRevenue),
    wowChange,
    invoiceCount: invoices.length,
    monthlySeries,
    dailySeries,
    topProducts,
    salesByUnit,
    recentInvoices,
    inventoryEnabled: settings.inventoryEnabled,
    lowStockProducts,
  };
}
