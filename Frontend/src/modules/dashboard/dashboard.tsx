import { useEffect, type ElementType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Wallet, CalendarDays, Sun, Receipt, TrendingUp, TrendingDown, ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { useStore } from '../../contexts/store-provider';
import { formatCurrency, formatDate } from '../../helpers/format-helper';
import PageHeader from '../../shared-components/page-header';
import EmptyState from '../../shared-components/empty-state';
import { PageLoader } from '../../shared-components/illustrations/loaders';
import { FarmScene } from '../../shared-components/illustrations/farm-scene';

const UNIT_COLORS = ['var(--color-primary-mid)', 'var(--color-accent-mid)', '#38bdf8', 'var(--color-primary-dark)', '#f97316'];

const KpiCard = ({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  tint: string;
}) => (
  <div className="card card-hover p-4 flex items-start justify-between">
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1.5">{label}</div>
      <div className="text-xl font-bold text-slate-900 tracking-tight">{value}</div>
    </div>
    <div className={`w-10 h-10 rounded-xl hidden sm:flex items-center justify-center shrink-0 ${tint}`}>
      <Icon size={18} />
    </div>
  </div>
);

const SectionCard = ({
  title,
  action,
  children,
  testId,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  testId?: string;
}) => (
  <div data-testid={testId} className="card card-hover p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const EmptyChart = () => (
  <div className="h-[200px] flex items-center justify-center">
    <EmptyState illustration="drops" title="No data yet" description="Charts fill up as you create invoices." />
  </div>
);

const Dashboard = () => {
  const { dashboardStore } = useStore();

  useEffect(() => {
    dashboardStore.fetchStatsAsync();
  }, [dashboardStore]);

  if (dashboardStore.inProgress) {
    return (
      <div data-testid="dashboard-page">
        <PageLoader variant="cow" label="Fetching fresh numbers…" />
      </div>
    );
  }

  const stats = dashboardStore.stats;
  if (!stats) {
    return (
      <div className="text-slate-400 py-24 text-center text-sm" data-testid="dashboard-page">
        Unable to load dashboard.
      </div>
    );
  }

  const wowPositive = stats.wowChange >= 0;
  const WowIcon = wowPositive ? TrendingUp : TrendingDown;

  return (
    <div data-testid="dashboard-page">
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="A snapshot of how the shop is doing right now." />

      <div
        data-testid="dashboard-hero"
        className="relative overflow-hidden rounded-2xl p-7 mb-6 text-white border-none shadow-lg shadow-primary/20"
        style={{ background: 'linear-gradient(135deg, var(--color-primary-mid) 0%, var(--color-primary) 55%, var(--color-primary-dark) 100%)' }}
      >
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-primary-mid/20 blur-2xl pointer-events-none" />
        <div className="absolute right-16 bottom-[-40px] w-40 h-40 rounded-full bg-accent-mid/10 blur-2xl pointer-events-none" />
        <FarmScene transparentSky className="absolute right-0 bottom-0 h-full w-[62%] opacity-[0.38] pointer-events-none hidden sm:block" />
        <div className="relative">
          <p className="text-white/90 text-sm font-medium mb-3">Welcome back to Vijay Dairy Operations</p>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/70 mb-1 font-semibold">This week&apos;s revenue</div>
              <div data-testid="hero-week-revenue" className="text-4xl font-bold" style={{ fontFamily: 'var(--font-serif-accent)' }}>
                {formatCurrency(stats.weekRevenue)}
              </div>
            </div>
            <span
              data-testid="hero-wow-badge"
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full mb-1 ${
                wowPositive ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'
              }`}
            >
              <WowIcon size={13} />
              {Math.abs(stats.wowChange)}% WoW
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={Wallet} tint="bg-primary-light text-primary" />
        <KpiCard label="This Month" value={formatCurrency(stats.monthRevenue)} icon={CalendarDays} tint="bg-accent-light text-accent" />
        <KpiCard label="Today" value={formatCurrency(stats.todayRevenue)} icon={Sun} tint="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Invoices" value={stats.invoiceCount} icon={Receipt} tint="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionCard title="Monthly Revenue" testId="monthly-chart">
          {stats.monthlySeries.every((m) => m.revenue === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e6e9df', fontSize: 12.5, boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Daily Revenue (30 days)" testId="daily-chart">
          {stats.dailySeries.every((d) => d.revenue === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={4} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e6e9df', fontSize: 12.5, boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}
                />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[5, 5, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SectionCard title="Top Products" testId="top-products-list">
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">No sales data yet.</p>
          ) : (
            <ul className="space-y-1">
              {stats.topProducts.map((p, idx) => (
                <li key={p.name} className="flex items-center justify-between text-sm py-2 first:pt-0 last:pb-0 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-400">Qty: {p.quantity}</div>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-700 shrink-0 ml-2">{formatCurrency(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Sales by Unit" testId="sales-by-unit-chart">
          {stats.salesByUnit.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.salesByUnit} dataKey="revenue" nameKey="unit" innerRadius={48} outerRadius={76} paddingAngle={3} strokeWidth={0}>
                  {stats.salesByUnit.map((entry, idx) => (
                    <Cell key={entry.unit} fill={UNIT_COLORS[idx % UNIT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e6e9df', fontSize: 12.5, boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
            {stats.salesByUnit.map((u, idx) => (
              <div key={u.unit} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: UNIT_COLORS[idx % UNIT_COLORS.length] }} />
                {u.unit}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Invoices"
          testId="recent-invoices-list"
          action={
            <Link to="/invoices" className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:text-primary-dark">
              View all <ArrowUpRight size={13} />
            </Link>
          }
        >
          {stats.recentInvoices.length === 0 ? (
            <p className="text-sm text-slate-400">No invoices yet.</p>
          ) : (
            <ul className="space-y-1">
              {stats.recentInvoices.map((inv) => (
                <li key={inv.id} className="flex justify-between text-sm py-2 first:pt-0 last:pb-0 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="font-medium text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-xs text-slate-400">
                      {formatDate(inv.createdAt)} · {inv.itemsCount} items
                    </div>
                  </div>
                  <span className="font-semibold text-slate-700">{formatCurrency(inv.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {stats.inventoryEnabled && (
        <SectionCard title="Low Stock Alerts" testId="low-stock-card">
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-400">All products are sufficiently stocked.</p>
          ) : (
            <table className="w-full text-sm -mx-1">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 px-1 font-semibold text-xs uppercase tracking-wide">Product</th>
                  <th className="py-2 px-1 text-right font-semibold text-xs uppercase tracking-wide">Stock</th>
                  <th className="py-2 px-1 text-right font-semibold text-xs uppercase tracking-wide">Threshold</th>
                  <th className="py-2 px-1 text-right font-semibold text-xs uppercase tracking-wide">Unit</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 px-1 font-medium text-slate-800">{p.name}</td>
                    <td className={`py-2.5 px-1 text-right font-semibold ${p.stock <= 0 ? 'text-red-600' : 'text-accent'}`}>{p.stock}</td>
                    <td className="py-2.5 px-1 text-right text-slate-500">{p.lowStockThreshold}</td>
                    <td className="py-2.5 px-1 text-right text-slate-500">{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}
    </div>
  );
};

export default observer(Dashboard);
