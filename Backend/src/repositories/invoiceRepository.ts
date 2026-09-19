import { getPool, withTransaction } from '../db';
import type { Invoice, InvoiceItem } from '../types';

const COLUMNS = 'id, invoice_number, items, subtotal, discount, tax_percent, tax_amount, total, notes, created_at';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (row: any): Invoice => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  items: Array.isArray(row.items) ? row.items : [],
  subtotal: row.subtotal,
  discount: row.discount,
  taxPercent: row.tax_percent,
  taxAmount: row.tax_amount,
  total: row.total,
  notes: row.notes,
  createdAt: row.created_at,
});

export type NewInvoice = Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>;

export const invoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    const { rows } = await getPool().query(`SELECT ${COLUMNS} FROM invoices ORDER BY created_at DESC LIMIT 1000`);
    return rows.map(map);
  },

  async getById(id: string): Promise<Invoice | null> {
    const { rows } = await getPool().query(`SELECT ${COLUMNS} FROM invoices WHERE id = $1`, [id]);
    return rows[0] ? map(rows[0]) : null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM invoices WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * One transaction: bump the global counter, insert the invoice, and (when inventory tracking is on) decrement
   * stock for each line whose productId is a UUID. No availability check - stock may go negative, as before.
   */
  async create(invoice: NewInvoice, decrementStock: boolean): Promise<Invoice> {
    return withTransaction(async (client) => {
      const seqResult = await client.query("UPDATE counters SET seq = seq + 1 WHERE id = 'invoice' RETURNING seq");
      const seq: number = seqResult.rows[0].seq;

      const now = new Date();
      const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const invoiceNumber = `VD-${yyyymm}-${String(seq).padStart(4, '0')}`;

      const inserted = await client.query(
        `INSERT INTO invoices (invoice_number, items, subtotal, discount, tax_percent, tax_amount, total, notes)
         VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, $8)
         RETURNING ${COLUMNS}`,
        [
          invoiceNumber,
          JSON.stringify(invoice.items),
          invoice.subtotal,
          invoice.discount,
          invoice.taxPercent,
          invoice.taxAmount,
          invoice.total,
          invoice.notes,
        ],
      );
      const created = map(inserted.rows[0]);

      if (decrementStock) {
        for (const item of invoice.items as InvoiceItem[]) {
          if (UUID_RE.test(item.productId)) {
            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.productId]);
          }
        }
      }

      return created;
    });
  },
};
