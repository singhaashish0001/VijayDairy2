import { Router } from 'express';
import type { Request } from 'express';
import multer from 'multer';
import { deletedEnvelope, ok } from '../envelope';
import { duplicateName, notFound, validation } from '../errors';
import { uuidParam } from '../middleware/common';
import { productRepository } from '../repositories/productRepository';
import { importProducts } from '../services/importProducts';
import { importStock } from '../services/importStock';
import { toNumber } from '../numbers';
import { isValidUnit } from '../types';
import type { Product, ProductField } from '../types';

export const productsRouter = Router();
productsRouter.param('id', uuidParam);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const toProductVM = (p: Product) => ({
  id: p.id,
  name: p.name,
  unit: p.unit,
  price: p.price,
  stock: p.stock,
  lowStockThreshold: p.lowStockThreshold,
  createdAt: p.createdAt,
});

const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === '23505';

const NAME_EMPTY = "'Name' must not be empty.";
const UNIT_INVALID = 'Invalid unit. Allowed: LTR, KG, PCS';
const PRICE_NEGATIVE = "'Price' must be greater than or equal to '0'.";

productsRouter.get('/', async (_req, res) => {
  res.json(ok((await productRepository.getAll()).map(toProductVM)));
});

productsRouter.post('/', async (req, res) => {
  const body = req.body ?? {};
  const name = typeof body.name === 'string' ? body.name : '';
  const unit = typeof body.unit === 'string' ? body.unit : '';
  const price = toNumber(body.price) ?? 0;

  const failures: string[] = [];
  if (name.trim() === '') failures.push(NAME_EMPTY);
  else if (name.length > 200) {
    failures.push(`The length of 'Name' must be 200 characters or fewer. You entered ${name.length} characters.`);
  }
  if (!isValidUnit(unit)) failures.push(UNIT_INVALID);
  if (price < 0) failures.push(PRICE_NEGATIVE);
  if (failures.length > 0) throw validation(failures.join(' '));

  if (await productRepository.getByName(name.trim())) throw duplicateName();

  try {
    const created = await productRepository.create({
      name: name.trim(),
      unit: unit.trim().toUpperCase(),
      price,
      stock: toNumber(body.stock) ?? 0,
      lowStockThreshold: toNumber(body.lowStockThreshold) ?? 0,
    });
    res.json(ok(toProductVM(created), 201));
  } catch (err) {
    if (isUniqueViolation(err)) throw duplicateName();
    throw err;
  }
});

productsRouter.put('/:id', async (req, res) => {
  const body = req.body ?? {};
  const has = (v: unknown) => v !== undefined && v !== null;

  const fields = new Set<ProductField>();
  const patch: Partial<Pick<Product, ProductField>> = {};
  if (has(body.name)) {
    fields.add('name');
    patch.name = String(body.name).trim();
  }
  if (has(body.unit)) {
    fields.add('unit');
    patch.unit = String(body.unit).trim().toUpperCase();
  }
  if (has(body.price)) {
    fields.add('price');
    patch.price = toNumber(body.price) ?? 0;
  }
  if (has(body.stock)) {
    fields.add('stock');
    patch.stock = toNumber(body.stock) ?? 0;
  }
  if (has(body.lowStockThreshold)) {
    fields.add('lowStockThreshold');
    patch.lowStockThreshold = toNumber(body.lowStockThreshold) ?? 0;
  }

  const failures: string[] = [];
  if (fields.size === 0) failures.push('No fields to update');
  if (has(body.unit) && !isValidUnit(body.unit)) failures.push(UNIT_INVALID);
  if (has(body.price) && (patch.price ?? 0) < 0) failures.push(PRICE_NEGATIVE);
  if (failures.length > 0) throw validation(failures.join(' '));

  let updated: Product | null;
  try {
    updated = await productRepository.update(String(req.params.id), patch, fields);
  } catch (err) {
    if (isUniqueViolation(err)) throw duplicateName();
    throw err;
  }
  if (!updated) throw notFound();
  res.json(ok(toProductVM(updated)));
});

productsRouter.delete('/:id', async (req, res) => {
  if (!(await productRepository.remove(String(req.params.id)))) throw notFound();
  res.json(deletedEnvelope());
});

/** Returns the uploaded .csv bytes or throws the same 400s as the .NET controller. */
function requireCsv(req: Request): Buffer {
  const file = (req.files as Express.Multer.File[] | undefined)?.find((f) => f.fieldname === 'file');
  if (!file || file.size === 0) throw validation('No file uploaded');
  if (!file.originalname.toLowerCase().endsWith('.csv')) throw validation('Only .csv files are accepted');
  return file.buffer;
}

/** Stock-only CSV import. mode=ADD (default) adds to the present stock, mode=SET replaces it. Never creates products. */
productsRouter.post('/stock-import', upload.any(), async (req, res) => {
  const mode = typeof req.query.mode === 'string' ? req.query.mode : undefined;
  res.json(ok(await importStock(productRepository, requireCsv(req), mode)));
});

productsRouter.post('/bulk-import', upload.any(), async (req, res) => {
  res.json(ok(await importProducts(productRepository, requireCsv(req))));
});
