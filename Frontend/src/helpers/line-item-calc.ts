/**
 * @file line-item-calc.ts
 * @description Pure quantity <-> amount maths for invoice lines. The product rate is the anchor: the user
 *              enters ONE value (quantity or amount) and the other is always derived, so a line can never
 *              hold an inconsistent combination. Mirrors Backend/.../Helpers/InvoiceLineCalculator.cs —
 *              keep the two in sync (the server re-derives and re-validates every line on save).
 */

export type SellingMode = 'QUANTITY' | 'AMOUNT';

export interface ILineCalcResult {
  ok: boolean;
  /** Derived (AMOUNT mode) or entered (QUANTITY mode), rounded to the unit's precision. null when not calculable. */
  quantity: number | null;
  /** Derived (QUANTITY mode) or entered (AMOUNT mode), 2 decimals. null when not calculable. */
  amount: number | null;
  error: string | null;
}

const AMOUNT_DECIMALS = 2;

export function supportsAmountMode(unit: string): boolean {
  const u = unit.toUpperCase();
  return u === 'KG' || u === 'LTR';
}

/** Display/storage precision for a unit's quantity. PCS is whole; weight/volume units keep 3 decimals. */
export function quantityDecimals(unit: string): number {
  return unit.toUpperCase() === 'PCS' ? 0 : 3;
}

/** Rounds half away from zero without binary-float drift (e.g. 1.005 -> 1.01). */
export function roundTo(value: number, decimals: number): number {
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Number(`${Math.abs(value)}e${decimals}`))) / 10 ** decimals || 0;
}

/** Quantity for display: rounded to the unit's precision, trailing zeros dropped (1.500 -> "1.5"). */
export function formatQuantity(quantity: number | null | undefined, unit: string): string {
  if (quantity === null || quantity === undefined || !Number.isFinite(quantity)) return '';
  return String(roundTo(quantity, quantityDecimals(unit)));
}

function parseEntry(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param value the quantity (QUANTITY mode) or the amount (AMOUNT mode) the user typed. Blank/NaN -> not ok.
 */
export function calculateLine(unit: string, rate: number, mode: SellingMode, value: number | string | null | undefined): ILineCalcResult {
  const fail = (error: string): ILineCalcResult => ({ ok: false, quantity: null, amount: null, error });
  const entered = parseEntry(value);
  const dp = quantityDecimals(unit);
  const label = mode === 'AMOUNT' ? 'amount' : 'quantity';

  if (mode === 'AMOUNT') {
    if (!supportsAmountMode(unit)) return fail('PCS products can only be sold by quantity.');
    if (rate <= 0) return fail('Rate must be greater than zero to calculate quantity.');
  }
  if (entered === null) return fail(`Please enter a valid ${label}.`);
  if (entered < 0) return fail(mode === 'AMOUNT' ? 'Amount cannot be negative.' : 'Quantity cannot be negative.');
  if (entered === 0) return fail(`Please enter a valid ${label}.`);

  if (mode === 'AMOUNT') {
    const quantity = roundTo(entered / rate, dp);
    if (quantity <= 0) return fail('Please enter a valid amount.');
    return { ok: true, quantity, amount: roundTo(entered, AMOUNT_DECIMALS), error: null };
  }

  if (dp === 0 && !Number.isInteger(entered)) return fail('PCS quantity must be a whole number.');
  const quantity = roundTo(entered, dp);
  if (quantity <= 0) return fail('Please enter a valid quantity.');
  return { ok: true, quantity, amount: roundTo(quantity * rate, AMOUNT_DECIMALS), error: null };
}

/** Net line total after the per-line discount; never negative. */
export function lineTotal(amount: number, discount: number): number {
  return Math.max(0, roundTo(amount - (discount || 0), AMOUNT_DECIMALS));
}

/**
 * Human-friendly quantity for display: KG as "1 kg 200 g" / "654 g", LTR as "1 L 500 ml" / "250 ml".
 * PCS is a plain whole number. Storage and calculations keep the decimal value (1.2), only the display splits it.
 */
export function formatQuantityPretty(quantity: number | null | undefined, unit: string): string {
  if (quantity === null || quantity === undefined || !Number.isFinite(quantity)) return '';
  const u = unit.toUpperCase();
  const q = roundTo(quantity, quantityDecimals(unit));
  if (u !== 'KG' && u !== 'LTR') return String(q);

  const [big, small] = u === 'KG' ? ['kg', 'g'] : ['L', 'ml'];
  let whole = Math.trunc(q);
  let fraction = Math.round((q - whole) * 1000);
  if (fraction >= 1000) {
    whole += 1;
    fraction = 0;
  }
  const parts: string[] = [];
  if (whole > 0) parts.push(`${whole} ${big}`);
  if (fraction > 0) parts.push(`${fraction} ${small}`);
  return parts.length > 0 ? parts.join(' ') : `0 ${big}`;
}
