export const PRODUCT_UNITS = ['LTR', 'KG', 'PCS'] as const;
export const isValidUnit = (unit: unknown): boolean =>
  typeof unit === 'string' && (PRODUCT_UNITS as readonly string[]).includes(unit.trim().toUpperCase());

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  createdAt: Date;
}

export type ProductField = 'name' | 'unit' | 'price' | 'stock' | 'lowStockThreshold';

export interface InvoiceItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
  /** Gross line amount (before the line discount). 0 / missing on invoices saved before selling modes existed. */
  amount: number;
  sellingMode: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  notes: string;
  createdAt: Date;
}

export interface BusinessSettings {
  id: string;
  shopName: string;
  address: string;
  phone: string;
  gstNumber: string;
  footerNote: string;
  inventoryEnabled: boolean;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  createdAt: Date;
}

export interface BulkImportResult {
  created: number;
  updated: number;
  total: number;
  errors: { row: number; error: string }[];
}

/** The slice of the product repository the CSV importers need (lets tests use an in-memory fake). */
export interface ProductStore {
  getByName(name: string): Promise<Product | null>;
  create(product: Pick<Product, 'name' | 'unit' | 'price' | 'stock' | 'lowStockThreshold'>): Promise<Product>;
  update(id: string, patch: Partial<Pick<Product, ProductField>>, fields: Set<ProductField>): Promise<Product | null>;
}
