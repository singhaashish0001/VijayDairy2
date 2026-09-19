import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../src/errors';
import { importProducts } from '../src/services/importProducts';
import { importStock } from '../src/services/importStock';
import type { Product, ProductField, ProductStore } from '../src/types';

class FakeStore implements ProductStore {
  products: Product[] = [];
  createCalls = 0;

  async getByName(name: string) {
    return this.products.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async create(p: Pick<Product, 'name' | 'unit' | 'price' | 'stock' | 'lowStockThreshold'>) {
    this.createCalls++;
    const product = { id: crypto.randomUUID(), createdAt: new Date(), ...p };
    this.products.push(product);
    return product;
  }
  async update(id: string, patch: Partial<Pick<Product, ProductField>>, fields: Set<ProductField>) {
    const p = this.products.find((x) => x.id === id)!;
    if (fields.has('stock')) p.stock = patch.stock!;
    if (fields.has('lowStockThreshold')) p.lowStockThreshold = patch.lowStockThreshold!;
    if (fields.has('unit')) p.unit = patch.unit!;
    if (fields.has('price')) p.price = patch.price!;
    return p;
  }
}

const p = (name: string, unit: string, price: number, stock: number, lowStockThreshold = 0): Product => ({
  id: crypto.randomUUID(),
  name,
  unit,
  price,
  stock,
  lowStockThreshold,
  createdAt: new Date(),
});

let store: FakeStore;
beforeEach(() => {
  store = new FakeStore();
  store.products.push(p('A2 Cow Milk', 'LTR', 96, 10, 5), p('Paneer', 'KG', 420, 3, 2));
});

const run = (csv: string, mode?: string) => importStock(store, Buffer.from(csv, 'utf8'), mode);

describe('importStock', () => {
  it('SET replaces stock and leaves price/unit alone', async () => {
    const r = await run('name,stock\nA2 Cow Milk,25\nPaneer,7.5\n', 'SET');
    expect(r.updated).toBe(2);
    expect(r.errors).toEqual([]);
    expect(store.products[0].stock).toBe(25);
    expect(store.products[1].stock).toBe(7.5);
    expect(store.products[0].price).toBe(96);
  });

  it('ADD adds to current stock', async () => {
    await run('name,stock\nA2 Cow Milk,5\nPaneer,-1\n', 'add');
    expect(store.products[0].stock).toBe(15);
    expect(store.products[1].stock).toBe(2);
  });

  it('ADD rejects a row that would go negative', async () => {
    const r = await run('name,stock\nPaneer,-10\n', 'ADD');
    expect(r.updated).toBe(0);
    expect(r.errors).toHaveLength(1);
    expect(store.products[1].stock).toBe(3);
  });

  it('reports unknown products and never creates them', async () => {
    const r = await run('name,stock\nGhee,4\n');
    expect(r.updated).toBe(0);
    expect(r.errors[0].error).toContain('not found');
    expect(store.createCalls).toBe(0);
    expect(store.products).toHaveLength(2);
  });

  it('matches names case-insensitively', async () => {
    expect((await run('name,stock\na2 cow milk,1\n')).updated).toBe(1);
  });

  it('threshold column present: blank means 0', async () => {
    await run('name,stock,low_stock_threshold\nA2 Cow Milk,20,\nPaneer,9,4\n');
    expect(store.products[0].lowStockThreshold).toBe(0);
    expect(store.products[1].lowStockThreshold).toBe(4);
  });

  it('threshold column absent: left untouched', async () => {
    await run('name,stock\nA2 Cow Milk,20\n');
    expect(store.products[0].lowStockThreshold).toBe(5);
  });

  it('invalid values are row errors and good rows still apply', async () => {
    const r = await run('name,stock,low_stock_threshold\nA2 Cow Milk,abc,\nPaneer,8,-2\n,3,\nPaneer,6,1\n');
    expect(r.errors).toHaveLength(3);
    expect(r.updated).toBe(1);
    expect(store.products[1].stock).toBe(9); // 3 present + 6 (default mode adds)
  });

  it('a missing required column throws a 400', async () => {
    await expect(run('name,qty\nPaneer,3\n')).rejects.toBeInstanceOf(AppError);
  });

  it('handles quoted names and a UTF-8 BOM', async () => {
    store.products.push(p('Ghee, Desi', 'KG', 650, 0));
    const r = await run('﻿name,stock\n"Ghee, Desi",12\n');
    expect(r.updated).toBe(1);
    expect(store.products[2].stock).toBe(12);
  });

  it.each([[';'], ['\t']])('auto-detects the %j delimiter', async (d) => {
    const r = await run(`name${d}stock${d}low_stock_threshold\r\nA2 Cow Milk${d}40${d}\r\nPaneer${d}9${d}3\r\n`, 'SET');
    expect(r.updated).toBe(2);
    expect(r.errors).toEqual([]);
    expect(store.products[0].stock).toBe(40);
    expect(store.products[0].lowStockThreshold).toBe(0);
    expect(store.products[1].lowStockThreshold).toBe(3);
  });

  it('ignores trailing blank Excel rows', async () => {
    const r = await run('name,stock,,\nA2 Cow Milk,20,,\n,,,\n , ,,\n');
    expect(r.updated).toBe(1);
    expect(r.errors).toEqual([]);
  });

  it('lists the found columns in the missing-column error', async () => {
    await expect(run('Product;Quantity\nPaneer;3\n')).rejects.toThrow('Found columns: product | quantity');
  });

  it('no mode defaults to adding', async () => {
    const r = await run('name,stock\nA2 Cow Milk,5\nPaneer,2\n');
    expect(r.updated).toBe(2);
    expect(store.products[0].stock).toBe(15);
    expect(store.products[1].stock).toBe(5);
  });
});

describe('importProducts', () => {
  it('creates new products and updates existing ones by name', async () => {
    const r = await importProducts(
      store,
      Buffer.from('name,unit,price,stock,low_stock_threshold\nA2 Cow Milk,LTR,100,20,4\nCurd,kg,60,5,1\nBad,BOX,1\nX,PCS,abc\n,PCS,1\n'),
    );
    expect(r.created).toBe(1);
    expect(r.updated).toBe(1);
    expect(r.total).toBe(2);
    expect(r.errors.map((e) => e.row)).toEqual([4, 5, 6]);
    expect(r.errors[0].error).toBe("Invalid unit 'BOX'. Allowed: LTR, KG, PCS");
    expect(r.errors[1].error).toBe("Invalid price 'abc'");
    expect(r.errors[2].error).toBe('Missing name');
    expect(store.products[0].price).toBe(100);
    expect(store.products[0].stock).toBe(20);
  });

  it('requires name, unit and price columns', async () => {
    await expect(importProducts(store, Buffer.from('name,price\nA,1\n'))).rejects.toThrow(
      'Missing required columns: unit. Found columns: name | price',
    );
  });
});
