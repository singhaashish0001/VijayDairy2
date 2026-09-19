/**
 * @file index.ts
 * @description Root store aggregator — combines every feature store into a single
 *              RootStore object, the single import point the context provider uses.
 */
import authStore, { AuthStore } from './auth-store';
import productStore, { ProductStore } from './product-store';
import invoiceStore, { InvoiceStore } from './invoice-store';
import settingsStore, { SettingsStore } from './settings-store';
import dashboardStore, { DashboardStore } from './dashboard-store';
import publicInvoiceStore, { PublicInvoiceStore } from './public-invoice-store';

export type RootStore = {
  authStore: AuthStore;
  productStore: ProductStore;
  invoiceStore: InvoiceStore;
  settingsStore: SettingsStore;
  dashboardStore: DashboardStore;
  publicInvoiceStore: PublicInvoiceStore;
};

const rootStore: RootStore = {
  authStore,
  productStore,
  invoiceStore,
  settingsStore,
  dashboardStore,
  publicInvoiceStore,
};

export default rootStore;
