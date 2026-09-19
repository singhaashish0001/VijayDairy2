import { describe, expect, it } from 'vitest';
import { roundHalfAwayFromZero } from '../src/numbers';
import { buildInvoice, parseInvoiceInput } from '../src/services/invoiceService';
import { calculateLine } from '../src/services/lineCalculator';

describe('calculateLine', () => {
  it.each([
    ['LTR', 100, 2, 200],
    ['KG', 80, 0.25, 20],
    ['KG', 80, 1.25, 100],
    ['LTR', 100, 2.75, 275],
    ['PCS', 20, 5, 100],
  ])('QUANTITY mode: %s rate %d qty %d -> amount %d', (unit, rate, qty, amount) => {
    const r = calculateLine(unit, rate, 'QUANTITY', qty);
    expect(r.ok).toBe(true);
    expect(r.quantity).toBe(qty);
    expect(r.amount).toBe(amount);
    expect(r.sellingMode).toBe('QUANTITY');
  });

  it.each([
    ['LTR', 100, 150, 1.5],
    ['KG', 80, 200, 2.5],
    ['KG', 80, 100, 1.25],
  ])('AMOUNT mode: %s rate %d amount %d -> qty %d', (unit, rate, amount, qty) => {
    const r = calculateLine(unit, rate, 'AMOUNT', amount);
    expect(r.ok).toBe(true);
    expect(r.quantity).toBe(qty);
    expect(r.amount).toBe(amount);
    expect(r.sellingMode).toBe('AMOUNT');
  });

  it('AMOUNT mode keeps the entered amount and rounds quantity to 3 decimals', () => {
    const r = calculateLine('LTR', 3, 'AMOUNT', 100);
    expect(r.ok).toBe(true);
    expect(r.quantity).toBe(33.333);
    expect(r.amount).toBe(100);
  });

  it('PCS cannot be sold by amount', () => {
    const r = calculateLine('PCS', 20, 'AMOUNT', 100);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('PCS products can only be sold by quantity.');
  });

  it('PCS rejects a fractional quantity', () => {
    const r = calculateLine('PCS', 20, 'QUANTITY', 1.5);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('PCS quantity must be a whole number.');
  });

  it('AMOUNT mode with zero rate does not divide by zero', () => {
    const r = calculateLine('KG', 0, 'AMOUNT', 100);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Rate must be greater than zero to calculate quantity.');
  });

  it('QUANTITY mode with zero rate is allowed and free', () => {
    const r = calculateLine('KG', 0, 'QUANTITY', 2);
    expect(r.ok).toBe(true);
    expect(r.amount).toBe(0);
  });

  it.each([
    ['QUANTITY', -1, 'Quantity cannot be negative.'],
    ['AMOUNT', -1, 'Amount cannot be negative.'],
    ['QUANTITY', 0, 'Please enter a valid quantity.'],
    ['AMOUNT', 0, 'Please enter a valid amount.'],
  ])('%s value %d is rejected', (mode, value, message) => {
    const r = calculateLine('KG', 80, mode, value);
    expect(r.ok).toBe(false);
    expect(r.error).toBe(message);
  });

  it.each([[null], [undefined], [''], ['garbage']])('missing or unknown mode %s defaults to QUANTITY', (mode) => {
    const r = calculateLine('LTR', 100, mode, 2);
    expect(r.ok).toBe(true);
    expect(r.sellingMode).toBe('QUANTITY');
    expect(r.amount).toBe(200);
  });

  it('mode is case-insensitive', () => {
    expect(calculateLine('LTR', 100, 'amount', 150).quantity).toBe(1.5);
  });

  it('AMOUNT mode too small to buy anything is rejected', () => {
    expect(calculateLine('KG', 100000, 'AMOUNT', 0.01).ok).toBe(false);
  });
});

describe('roundHalfAwayFromZero', () => {
  it('rounds midpoints away from zero, avoiding float artefacts', () => {
    expect(roundHalfAwayFromZero(1.005, 2)).toBe(1.01);
    expect(roundHalfAwayFromZero(2.5, 0)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5, 0)).toBe(-3);
    expect(roundHalfAwayFromZero(0.0005, 3)).toBe(0.001);
  });
});

describe('invoice validation and totals', () => {
  it('rejects an inconsistent PCS amount item', () => {
    expect(() =>
      parseInvoiceInput({ items: [{ name: 'Chocolate', unit: 'PCS', price: 20, sellingMode: 'AMOUNT', amount: 100 }] }),
    ).toThrow(/Chocolate: PCS products can only be sold by quantity\./);
  });

  it('accepts a legacy payload without sellingMode', () => {
    expect(() => parseInvoiceInput({ items: [{ name: 'Milk', unit: 'LTR', price: 100, quantity: 2, total: 200 }] })).not.toThrow();
  });

  it('requires at least one item', () => {
    expect(() => parseInvoiceInput({ items: [] })).toThrow('Invoice must contain at least one item');
  });

  it('recomputes lines and totals server-side, ignoring client totals', () => {
    const input = parseInvoiceInput({
      items: [
        { productId: 'x', name: 'Milk', unit: 'LTR', price: 100, quantity: 2, discount: 10, total: 999 },
        { productId: 'y', name: 'Paneer', unit: 'KG', price: 80, sellingMode: 'AMOUNT', amount: 100 },
      ],
      discount: 5,
      taxPercent: 5,
    });
    const inv = buildInvoice(input);
    expect(inv.items[0].total).toBe(190);
    expect(inv.items[1].quantity).toBe(1.25);
    expect(inv.subtotal).toBe(290);
    expect(inv.discount).toBe(5);
    expect(inv.taxAmount).toBe(14.25); // (290 - 5) * 5%
    expect(inv.total).toBe(299.25);
  });
});
