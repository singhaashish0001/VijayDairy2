import { describe, expect, it } from 'vitest';
import { PRODUCT_CSV_CONTENT, STOCK_CSV_HEADER, buildStockCsv } from './product-csv-template';

const rows = (csv: string) => csv.split('\r\n').filter(Boolean);

describe('buildStockCsv', () => {
  const products = [
    { name: 'A2 Cow Milk', stock: 12.5, lowStockThreshold: 3 },
    { name: 'Paneer', stock: 4, lowStockThreshold: 0 },
  ];

  it('uses the header the stock importer requires', () => {
    expect(STOCK_CSV_HEADER).toBe('name,stock,low_stock_threshold');
    expect(rows(buildStockCsv())[0]).toBe(STOCK_CSV_HEADER);
  });

  it('falls back to a sample when there are no products', () => {
    expect(rows(buildStockCsv([])).length).toBeGreaterThan(1);
  });

  it('in SET mode pre-fills current stock so it can be edited', () => {
    expect(rows(buildStockCsv(products, 'SET'))).toEqual([STOCK_CSV_HEADER, 'A2 Cow Milk,12.5,3', 'Paneer,4,0']);
  });

  it('in ADD mode (the default) starts every stock at 0 so an untouched upload adds nothing', () => {
    const expected = [STOCK_CSV_HEADER, 'A2 Cow Milk,0,3', 'Paneer,0,0'];
    expect(rows(buildStockCsv(products))).toEqual(expected);
    expect(rows(buildStockCsv(products, 'ADD'))).toEqual(expected);
  });

  it('quotes names containing commas or quotes so the CSV stays valid', () => {
    const csv = buildStockCsv([{ name: 'Ghee, "Desi"', stock: 4, lowStockThreshold: 1 }], 'SET');
    expect(csv).toContain('"Ghee, ""Desi""",4,1');
  });
});

describe('product sample csv', () => {
  it('still starts with the products header', () => {
    expect(PRODUCT_CSV_CONTENT.startsWith('name,unit,price,stock,low_stock_threshold')).toBe(true);
  });
});
