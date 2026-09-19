/**
 * @file product-csv-template.ts
 * @description Sample CSV for bulk product import. Columns match what the backend BulkImportProductsHandler
 *              reads: name, unit (LTR | KG | PCS) and price are required; stock and low_stock_threshold are optional.
 */
export const PRODUCT_CSV_FILENAME = 'products_sample.csv';

export const PRODUCT_CSV_CONTENT = [
  'name,unit,price,stock,low_stock_threshold',
  'A2 Cow Milk,LTR,100,50,10',
  'Full Cream Milk,LTR,60,100,10',
  'Paneer,KG,320,20,2',
  'Ghee,KG,650,15,3',
  'Chocolate,PCS,20,200,25',
  '',
].join('\r\n');

/** Downloads the sample CSV. A UTF-8 BOM is prepended so Excel opens it correctly. */
export function downloadProductSampleCsv() {
  const blob = new Blob(['﻿', PRODUCT_CSV_CONTENT], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = PRODUCT_CSV_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------------- Stock-only import ---------------------------- */

/** ADD (default) adds the CSV value to each product's present stock; SET replaces the stock with the CSV value. */
export type StockImportMode = 'SET' | 'ADD';

export const STOCK_CSV_FILENAME = 'stock_import.csv';
export const STOCK_CSV_HEADER = 'name,stock,low_stock_threshold';

const STOCK_SAMPLE_ROWS = ['A2 Cow Milk,50,10', 'Paneer,20,2', 'Chocolate,200,'];

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Builds the stock CSV text. With products, every product gets a row and its current low-stock threshold.
 * The stock cell is the current stock for SET (edit it), but 0 for ADD — the quantity to add — so uploading the
 * untouched file in ADD mode never doubles anyone's stock.
 */
export function buildStockCsv(products?: Array<{ name: string; stock: number; lowStockThreshold: number }>, mode: StockImportMode = 'ADD'): string {
  const rows =
    products && products.length > 0
      ? products.map((p) => [csvCell(p.name), mode === 'SET' ? p.stock : 0, p.lowStockThreshold].join(','))
      : STOCK_SAMPLE_ROWS;
  return [STOCK_CSV_HEADER, ...rows, ''].join('\r\n');
}

/** Downloads a stock CSV — pre-filled with the user's own products when there are any, otherwise a small sample. */
export function downloadStockCsv(products?: Array<{ name: string; stock: number; lowStockThreshold: number }>, mode: StockImportMode = 'ADD') {
  downloadCsv(STOCK_CSV_FILENAME, buildStockCsv(products, mode));
}
