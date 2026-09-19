import { validation } from '../errors';
import { round2, toNumber } from '../numbers';
import type { NewInvoice } from '../repositories/invoiceRepository';
import type { Invoice, InvoiceItem } from '../types';
import { calculateLine, normalizeMode, SellingModes } from './lineCalculator';

/** A line as sent by the client (keys already camelCased). Quantity/amount are re-derived server-side. */
export interface InvoiceItemInput {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  discount?: number;
  sellingMode?: string;
  amount?: number;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseItem(raw: any): InvoiceItemInput {
  return {
    productId: str(raw?.productId),
    name: str(raw?.name),
    unit: str(raw?.unit),
    price: toNumber(raw?.price) ?? 0,
    quantity: toNumber(raw?.quantity) ?? 0,
    discount: toNumber(raw?.discount),
    sellingMode: typeof raw?.sellingMode === 'string' ? raw.sellingMode : undefined,
    amount: toNumber(raw?.amount),
  };
}

/** The value the user typed for this line: the amount in AMOUNT mode, otherwise the quantity. */
const enteredValue = (item: InvoiceItemInput) =>
  normalizeMode(item.sellingMode) === SellingModes.Amount ? (item.amount ?? 0) : item.quantity;

export interface InvoiceInput {
  items: InvoiceItemInput[];
  notes?: string;
  discount?: number;
  taxPercent?: number;
}

/** Validates the body like the FluentValidation rules did; all failures are joined with a space into one 400. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseInvoiceInput(body: any): InvoiceInput {
  const failures: string[] = [];
  const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : [];
  if (rawItems.length === 0) failures.push('Invoice must contain at least one item');

  const items = rawItems.map(parseItem);
  for (const item of items) {
    if ((item.discount ?? 0) < 0) {
      failures.push('Discount cannot be negative.');
      continue;
    }
    const line = calculateLine(item.unit, item.price, item.sellingMode, enteredValue(item));
    if (!line.ok) failures.push(`${item.name}: ${line.error}`);
  }
  if (failures.length > 0) throw validation(failures.join(' '));

  return {
    items,
    notes: typeof body?.notes === 'string' ? body.notes : undefined,
    discount: toNumber(body?.discount),
    taxPercent: toNumber(body?.taxPercent),
  };
}

/** Recomputes every line and the invoice totals; client-sent totals are ignored. */
export function buildInvoice(input: InvoiceInput): NewInvoice {
  const items: InvoiceItem[] = input.items.map((i) => {
    const line = calculateLine(i.unit, i.price, i.sellingMode, enteredValue(i));
    const discount = i.discount ?? 0;
    return {
      productId: i.productId,
      name: i.name,
      unit: i.unit,
      price: i.price,
      quantity: line.quantity,
      discount,
      total: Math.max(0, round2(line.amount - discount)),
      amount: line.amount,
      sellingMode: line.sellingMode,
    };
  });

  const subtotal = round2(items.reduce((sum, i) => sum + i.total, 0));
  const discount = round2(input.discount ?? 0);
  const taxPercent = input.taxPercent ?? 0;
  const taxAmount = round2(((subtotal - discount) * taxPercent) / 100);
  const total = round2(subtotal - discount + taxAmount);

  return { items, subtotal, discount, taxPercent, taxAmount, total, notes: input.notes ?? '' };
}

/** API view of an invoice, including the legacy-row fixes (missing amount / sellingMode). */
export function toInvoiceVM(invoice: Invoice) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    items: invoice.items.map((i) => ({
      productId: i.productId ?? '',
      name: i.name ?? '',
      unit: i.unit ?? '',
      price: i.price ?? 0,
      quantity: i.quantity ?? 0,
      discount: i.discount ?? 0,
      total: i.total ?? 0,
      // Invoices saved before selling modes existed have no stored amount; it is the net total plus the line discount.
      amount: i.amount ? i.amount : round2((i.total ?? 0) + (i.discount ?? 0)),
      sellingMode: i.sellingMode ? i.sellingMode : 'QUANTITY',
    })),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    taxPercent: invoice.taxPercent,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
  };
}
