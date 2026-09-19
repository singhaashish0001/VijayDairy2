import { describe, expect, it } from 'vitest';
import { calculateLine, formatQuantity, lineTotal, quantityDecimals, formatQuantityPretty, roundTo, supportsAmountMode } from './line-item-calc';

describe('unit rules', () => {
  it('only KG and LTR support amount mode', () => {
    expect(supportsAmountMode('KG')).toBe(true);
    expect(supportsAmountMode('LTR')).toBe(true);
    expect(supportsAmountMode('PCS')).toBe(false);
  });

  it('uses 0 decimals for PCS and 3 for KG/LTR', () => {
    expect(quantityDecimals('PCS')).toBe(0);
    expect(quantityDecimals('KG')).toBe(3);
    expect(quantityDecimals('LTR')).toBe(3);
  });
});

describe('quantity mode: amount = quantity x rate', () => {
  it.each([
    ['LTR', 100, 2, 200],
    ['KG', 80, 0.25, 20],
    ['KG', 80, 1.25, 100],
    ['LTR', 100, 2.75, 275],
    ['PCS', 20, 5, 100],
  ])('%s @ %d x %d = %d', (unit, rate, qty, amount) => {
    const r = calculateLine(unit, rate, 'QUANTITY', qty);
    expect(r).toEqual({ ok: true, quantity: qty, amount, error: null });
  });

  it('accepts string input from an <input>', () => {
    expect(calculateLine('LTR', 100, 'QUANTITY', '1.5').amount).toBe(150);
  });
});

describe('amount mode: quantity = amount / rate', () => {
  it.each([
    ['LTR', 100, 150, 1.5],
    ['KG', 80, 200, 2.5],
    ['KG', 80, 100, 1.25],
  ])('%s @ %d, amount %d -> %d', (unit, rate, amount, qty) => {
    expect(calculateLine(unit, rate, 'AMOUNT', amount)).toEqual({ ok: true, quantity: qty, amount, error: null });
  });

  it('keeps the entered amount and rounds only the quantity (to 3 dp)', () => {
    const r = calculateLine('LTR', 3, 'AMOUNT', 100);
    expect(r.quantity).toBe(33.333);
    expect(r.amount).toBe(100);
  });
});

describe('PCS restrictions', () => {
  it('rejects amount mode', () => {
    const r = calculateLine('PCS', 20, 'AMOUNT', 100);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('PCS products can only be sold by quantity.');
  });

  it('rejects fractional quantity', () => {
    const r = calculateLine('PCS', 20, 'QUANTITY', 1.5);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('PCS quantity must be a whole number.');
  });
});

describe('edge cases', () => {
  it('never divides by zero in amount mode', () => {
    const r = calculateLine('KG', 0, 'AMOUNT', 100);
    expect(r).toEqual({ ok: false, quantity: null, amount: null, error: 'Rate must be greater than zero to calculate quantity.' });
  });

  it.each([[''], [null], [undefined], [NaN], ['abc']])('blank/invalid input %s yields no NaN/Infinity', (value) => {
    for (const mode of ['QUANTITY', 'AMOUNT'] as const) {
      const r = calculateLine('KG', 80, mode, value as never);
      expect(r.ok).toBe(false);
      expect(r.quantity).toBeNull();
      expect(r.amount).toBeNull();
    }
    expect(calculateLine('KG', 80, 'AMOUNT', '').error).toBe('Please enter a valid amount.');
    expect(calculateLine('KG', 80, 'QUANTITY', '').error).toBe('Please enter a valid quantity.');
  });

  it('rejects negatives', () => {
    expect(calculateLine('KG', 80, 'QUANTITY', -1).error).toBe('Quantity cannot be negative.');
    expect(calculateLine('KG', 80, 'AMOUNT', -1).error).toBe('Amount cannot be negative.');
  });

  it('rejects zero', () => {
    expect(calculateLine('KG', 80, 'QUANTITY', 0).ok).toBe(false);
    expect(calculateLine('KG', 80, 'AMOUNT', 0).ok).toBe(false);
  });

  it('rejects an amount too small to buy any quantity', () => {
    expect(calculateLine('KG', 100000, 'AMOUNT', 0.01).ok).toBe(false);
  });

  it('allows a zero rate in quantity mode (free item)', () => {
    expect(calculateLine('KG', 0, 'QUANTITY', 2)).toMatchObject({ ok: true, amount: 0 });
  });
});

describe('rounding & formatting', () => {
  it('rounds half away from zero without float drift', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.675, 2)).toBe(2.68);
    expect(roundTo(1.0005, 3)).toBe(1.001);
  });

  it('formats quantity by unit precision and drops trailing zeros', () => {
    expect(formatQuantity(1.5, 'LTR')).toBe('1.5');
    expect(formatQuantity(2, 'KG')).toBe('2');
    expect(formatQuantity(33.33333, 'LTR')).toBe('33.333');
    expect(formatQuantity(null, 'LTR')).toBe('');
    expect(formatQuantity(Infinity, 'LTR')).toBe('');
  });

  it('computes net line total, never negative', () => {
    expect(lineTotal(200, 20)).toBe(180);
    expect(lineTotal(100, 500)).toBe(0);
    expect(lineTotal(100, NaN)).toBe(100);
  });
});

describe('formatQuantityPretty', () => {
  it.each([
    [1.2, 'KG', '1 kg 200 g'],
    [0.654, 'KG', '654 g'],
    [0.774, 'KG', '774 g'],
    [2, 'KG', '2 kg'],
    [2.5, 'KG', '2 kg 500 g'],
    [0.25, 'KG', '250 g'],
    [1.005, 'KG', '1 kg 5 g'],
    [1.5, 'LTR', '1 L 500 ml'],
    [0.25, 'LTR', '250 ml'],
    [3, 'LTR', '3 L'],
    [5, 'PCS', '5'],
    [0, 'KG', '0 kg'],
  ])('%d %s -> %s', (q, unit, expected) => {
    expect(formatQuantityPretty(q, unit)).toBe(expected);
  });

  it('carries 999.6 g up to the next kg and tolerates float noise', () => {
    expect(formatQuantityPretty(0.9996, 'KG')).toBe('1 kg');
    expect(formatQuantityPretty(0.1 + 0.2, 'KG')).toBe('300 g');
  });

  it('returns empty for invalid input', () => {
    expect(formatQuantityPretty(null, 'KG')).toBe('');
    expect(formatQuantityPretty(NaN, 'KG')).toBe('');
  });
});
