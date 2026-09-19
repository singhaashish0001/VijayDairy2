import { validation } from '../errors';
import { tryParseDecimal } from '../numbers';
import type { BulkImportResult, ProductField, ProductStore } from '../types';
import { cell, decodeCsv, isBlankRow, missingColumnsMessage, parseCsv, splitCsvLine } from './csvParser';

export const StockImportModes = { Add: 'ADD', Set: 'SET' } as const;

/**
 * Stock-only CSV import: name,stock[,low_stock_threshold]. Default mode ADD adds to the present stock; SET replaces
 * it. Never creates products and never touches name/unit/price.
 */
export async function importStock(store: ProductStore, file: Buffer, modeInput?: string | null): Promise<BulkImportResult> {
  const mode = (modeInput ?? '').toUpperCase() === StockImportModes.Set ? StockImportModes.Set : StockImportModes.Add;

  const result: BulkImportResult = { created: 0, updated: 0, total: 0, errors: [] };
  const csv = parseCsv(decodeCsv(file));
  if (!csv) return result;

  const { lines, delimiter, headers } = csv;
  const missing = ['name', 'stock'].filter((r) => !headers.includes(r));
  if (missing.length > 0) throw validation(missingColumnsMessage(missing, headers));

  const nameIdx = headers.indexOf('name');
  const stockIdx = headers.indexOf('stock');
  // Optional column: when present, a blank cell means threshold 0. When absent, thresholds are left untouched.
  const thresholdIdx = headers.indexOf('low_stock_threshold');
  const fields = new Set<ProductField>(['stock']);
  if (thresholdIdx >= 0) fields.add('lowStockThreshold');

  for (let i = 1; i < lines.length; i++) {
    const row = i + 1;
    const cols = splitCsvLine(lines[i], delimiter);
    if (isBlankRow(cols)) continue;

    const name = cell(cols, nameIdx).trim();
    const stockRaw = cell(cols, stockIdx).trim();

    if (!name) {
      result.errors.push({ row, error: 'Missing name' });
      continue;
    }
    const value = tryParseDecimal(stockRaw);
    if (value === null) {
      result.errors.push({ row, error: `Invalid stock '${stockRaw}'` });
      continue;
    }

    let threshold = 0;
    if (thresholdIdx >= 0) {
      const thresholdRaw = cell(cols, thresholdIdx).trim();
      if (thresholdRaw.length > 0) {
        const parsed = tryParseDecimal(thresholdRaw);
        if (parsed === null || parsed < 0) {
          result.errors.push({ row, error: `Invalid low_stock_threshold '${thresholdRaw}'` });
          continue;
        }
        threshold = parsed;
      }
    }

    const existing = await store.getByName(name);
    if (!existing) {
      result.errors.push({ row, error: `Product '${name}' not found (stock import never creates products)` });
      continue;
    }

    const newStock = mode === StockImportModes.Add ? existing.stock + value : value;
    if (newStock < 0) {
      result.errors.push({ row, error: `Stock for '${name}' cannot be negative (would become ${newStock})` });
      continue;
    }

    await store.update(existing.id, { stock: newStock, lowStockThreshold: threshold }, fields);
    result.updated++;
  }

  result.total = result.updated;
  return result;
}
