import { validation } from '../errors';
import { tryParseDecimal } from '../numbers';
import { isValidUnit } from '../types';
import type { BulkImportResult, ProductField, ProductStore } from '../types';
import { cell, decodeCsv, isBlankRow, missingColumnsMessage, parseCsv, splitCsvLine } from './csvParser';

/** Product CSV import: name,unit,price[,stock][,low_stock_threshold]. Creates new products, updates existing ones by name. */
export async function importProducts(store: ProductStore, file: Buffer): Promise<BulkImportResult> {
  const result: BulkImportResult = { created: 0, updated: 0, total: 0, errors: [] };
  const csv = parseCsv(decodeCsv(file));
  if (!csv) return result;

  const { lines, delimiter, headers } = csv;
  const missing = ['name', 'unit', 'price'].filter((r) => !headers.includes(r));
  if (missing.length > 0) throw validation(missingColumnsMessage(missing, headers));

  const nameIdx = headers.indexOf('name');
  const unitIdx = headers.indexOf('unit');
  const priceIdx = headers.indexOf('price');
  const stockIdx = headers.indexOf('stock');
  const thresholdIdx = headers.indexOf('low_stock_threshold');

  for (let i = 1; i < lines.length; i++) {
    const row = i + 1;
    const cols = splitCsvLine(lines[i], delimiter);
    if (isBlankRow(cols)) continue;

    const name = cell(cols, nameIdx).trim();
    const unit = cell(cols, unitIdx).trim().toUpperCase();
    const priceRaw = cell(cols, priceIdx).trim();

    if (!name) {
      result.errors.push({ row, error: 'Missing name' });
      continue;
    }
    if (!isValidUnit(unit)) {
      result.errors.push({ row, error: `Invalid unit '${unit}'. Allowed: LTR, KG, PCS` });
      continue;
    }
    const price = tryParseDecimal(priceRaw);
    if (price === null || price < 0) {
      result.errors.push({ row, error: `Invalid price '${priceRaw}'` });
      continue;
    }

    // Unparseable stock / threshold silently become 0 (decimal.TryParse's out value in the original).
    const stock = stockIdx >= 0 ? (tryParseDecimal(cell(cols, stockIdx)) ?? 0) : 0;
    const lowStockThreshold = thresholdIdx >= 0 ? (tryParseDecimal(cell(cols, thresholdIdx)) ?? 0) : 0;

    const existing = await store.getByName(name);
    if (!existing) {
      await store.create({ name, unit, price, stock, lowStockThreshold });
      result.created++;
    } else {
      const fields = new Set<ProductField>(['unit', 'price', 'stock', 'lowStockThreshold']);
      await store.update(existing.id, { unit, price, stock, lowStockThreshold }, fields);
      result.updated++;
    }
  }

  result.total = result.created + result.updated;
  return result;
}
