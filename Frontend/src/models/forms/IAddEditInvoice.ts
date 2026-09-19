import type { SellingMode } from '../../helpers/line-item-calc';

export interface IInvoiceLineItem {
  productId: string;
  name: string;
  unit: string;
  /** The product's rate (per unit) — the anchor for every calculation. */
  price: number;
  quantity: number;
  discount: number;
  /** Gross amount (price x quantity) before the line discount. In AMOUNT mode this is the value the user entered. */
  amount: number;
  sellingMode: SellingMode;
  /** Net line total: amount - discount. */
  total: number;
}

export interface IAddInvoice {
  items: IInvoiceLineItem[];
  notes: string;
  discount: number;
  taxPercent: number;
}
