/**
 * @file url-constants.ts
 * @description Central registry of every backend API endpoint used by the stores.
 *              Keeping paths here (rather than inline in each store) means a route
 *              change only needs updating in one place.
 */
const URLConstants = {
  Login: '/auth/login',
  Me: '/auth/me',
  Logout: '/auth/logout',

  Products: '/products',
  ProductsBulkImport: '/products/bulk-import',
  ProductsStockImport: '/products/stock-import',

  Invoices: '/invoices',

  Settings: '/settings',

  DashboardStats: '/dashboard/stats',

  PublicInvoice: '/public/invoices',
};

export default URLConstants;
