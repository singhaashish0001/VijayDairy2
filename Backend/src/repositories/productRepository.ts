import { getPool } from '../db';
import type { Product, ProductField, ProductStore } from '../types';

const COLUMNS = 'id, name, unit, price, stock, low_stock_threshold, created_at';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (row: any): Product => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  price: row.price,
  stock: row.stock,
  lowStockThreshold: row.low_stock_threshold,
  createdAt: row.created_at,
});

const COLUMN_BY_FIELD: Record<ProductField, string> = {
  name: 'name',
  unit: 'unit',
  price: 'price',
  stock: 'stock',
  lowStockThreshold: 'low_stock_threshold',
};

export const productRepository: ProductStore & {
  getAll(): Promise<Product[]>;
  remove(id: string): Promise<boolean>;
  getLowStock(limit: number): Promise<Product[]>;
} = {
  async getAll() {
    const { rows } = await getPool().query(`SELECT ${COLUMNS} FROM products ORDER BY name ASC LIMIT 1000`);
    return rows.map(map);
  },

  async getByName(name) {
    const { rows } = await getPool().query(`SELECT ${COLUMNS} FROM products WHERE LOWER(name) = LOWER($1)`, [name]);
    return rows[0] ? map(rows[0]) : null;
  },

  async create(product) {
    const { rows } = await getPool().query(
      `INSERT INTO products (name, unit, price, stock, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [product.name, product.unit, product.price, product.stock, product.lowStockThreshold],
    );
    return map(rows[0]);
  },

  /** Partial update: only the whitelisted fields present in `fields` are written. */
  async update(id, patch, fields) {
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const field of Object.keys(COLUMN_BY_FIELD) as ProductField[]) {
      if (!fields.has(field)) continue;
      params.push(patch[field]);
      sets.push(`${COLUMN_BY_FIELD[field]} = $${params.length}`);
    }
    params.push(id);
    const { rows } = await getPool().query(
      `UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING ${COLUMNS}`,
      params,
    );
    return rows[0] ? map(rows[0]) : null;
  },

  async remove(id) {
    const result = await getPool().query('DELETE FROM products WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async getLowStock(limit) {
    const { rows } = await getPool().query(
      `SELECT ${COLUMNS} FROM products
       WHERE low_stock_threshold > 0 AND stock <= low_stock_threshold
       ORDER BY stock ASC LIMIT $1`,
      [limit],
    );
    return rows.map(map);
  },
};
