export interface IMonthPoint {
  month: string;
  revenue: number;
}

export interface IDayPoint {
  date: string;
  revenue: number;
}

export interface ITopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface IUnitSales {
  unit: string;
  revenue: number;
}

export interface IRecentInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  itemsCount: number;
  createdAt: string;
}

export interface ILowStockProduct {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  unit: string;
}

export default interface IDashboardStatsResponse {
  totalRevenue: number;
  monthRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  wowChange: number;
  invoiceCount: number;
  monthlySeries: IMonthPoint[];
  dailySeries: IDayPoint[];
  topProducts: ITopProduct[];
  salesByUnit: IUnitSales[];
  recentInvoices: IRecentInvoice[];
  inventoryEnabled: boolean;
  lowStockProducts: ILowStockProduct[];
}
