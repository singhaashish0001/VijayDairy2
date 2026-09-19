import { roundHalfAwayFromZero } from '../numbers';

export const SellingModes = { Quantity: 'QUANTITY', Amount: 'AMOUNT' } as const;
export type SellingMode = (typeof SellingModes)[keyof typeof SellingModes];

export interface LineCalculation {
  ok: boolean;
  quantity: number;
  amount: number;
  sellingMode: SellingMode;
  error: string | null;
}

export const AMOUNT_DECIMALS = 2;

export const supportsAmountMode = (unit: string) => ['KG', 'LTR'].includes(unit.toUpperCase());
export const quantityDecimals = (unit: string) => (unit.toUpperCase() === 'PCS' ? 0 : 3);
export const normalizeMode = (mode?: string | null): SellingMode =>
  (mode ?? '').toUpperCase() === SellingModes.Amount ? SellingModes.Amount : SellingModes.Quantity;

/**
 * Single source of truth for invoice line maths. The rate is the anchor; whichever of quantity/amount the user
 * did NOT enter is always derived from it. Mirrored by Frontend/src/helpers/line-item-calc.ts.
 * `value` is the quantity (QUANTITY mode) or the gross amount (AMOUNT mode) the user entered.
 */
export function calculateLine(unit: string, rate: number, sellingMode: string | null | undefined, value: number): LineCalculation {
  const mode = normalizeMode(sellingMode);
  const dp = quantityDecimals(unit);
  const fail = (error: string): LineCalculation => ({ ok: false, quantity: 0, amount: 0, sellingMode: mode, error });

  if (rate < 0) return fail('Rate cannot be negative.');

  if (mode === SellingModes.Amount) {
    if (!supportsAmountMode(unit)) return fail('PCS products can only be sold by quantity.');
    if (value < 0) return fail('Amount cannot be negative.');
    if (value === 0) return fail('Please enter a valid amount.');
    if (rate === 0) return fail('Rate must be greater than zero to calculate quantity.');

    const quantity = roundHalfAwayFromZero(value / rate, dp);
    if (quantity <= 0) return fail('Please enter a valid amount.');
    return { ok: true, quantity, amount: roundHalfAwayFromZero(value, AMOUNT_DECIMALS), sellingMode: mode, error: null };
  }

  if (value < 0) return fail('Quantity cannot be negative.');
  if (value === 0) return fail('Please enter a valid quantity.');
  if (dp === 0 && value !== Math.trunc(value)) return fail('PCS quantity must be a whole number.');

  const qty = roundHalfAwayFromZero(value, dp);
  if (qty <= 0) return fail('Please enter a valid quantity.');
  return { ok: true, quantity: qty, amount: roundHalfAwayFromZero(qty * rate, AMOUNT_DECIMALS), sellingMode: mode, error: null };
}
