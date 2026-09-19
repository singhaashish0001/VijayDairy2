import type { SellingMode } from '../../helpers/line-item-calc';

export interface IInvoiceItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
  /** Gross amount before the line discount. */
  amount: number;
  sellingMode: SellingMode;
}

export default interface IInvoiceResponse {
  id: string;
  invoiceNumber: string;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  notes: string;
  createdAt: string;
}
