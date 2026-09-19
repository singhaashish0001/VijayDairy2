import { getPool } from '../db';
import type { BusinessSettings } from '../types';

const COLUMNS = 'id, shop_name, address, phone, gst_number, footer_note, inventory_enabled';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (row: any): BusinessSettings => ({
  id: row.id,
  shopName: row.shop_name,
  address: row.address,
  phone: row.phone,
  gstNumber: row.gst_number,
  footerNote: row.footer_note,
  inventoryEnabled: row.inventory_enabled,
});

export const DEFAULT_FOOTER_NOTE = 'Thank you for your business!';

export const settingsRepository = {
  async get(): Promise<BusinessSettings> {
    const { rows } = await getPool().query(`SELECT ${COLUMNS} FROM settings WHERE id = 'business'`);
    if (rows[0]) return map(rows[0]);
    return {
      id: 'business',
      shopName: 'Vijay Dairy',
      address: '',
      phone: '',
      gstNumber: '',
      footerNote: DEFAULT_FOOTER_NOTE,
      inventoryEnabled: false,
    };
  },

  async upsert(s: Omit<BusinessSettings, 'id'>): Promise<BusinessSettings> {
    const { rows } = await getPool().query(
      `INSERT INTO settings (id, shop_name, address, phone, gst_number, footer_note, inventory_enabled)
       VALUES ('business', $1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         shop_name = EXCLUDED.shop_name,
         address = EXCLUDED.address,
         phone = EXCLUDED.phone,
         gst_number = EXCLUDED.gst_number,
         footer_note = EXCLUDED.footer_note,
         inventory_enabled = EXCLUDED.inventory_enabled
       RETURNING ${COLUMNS}`,
      [s.shopName, s.address, s.phone, s.gstNumber, s.footerNote, s.inventoryEnabled],
    );
    return map(rows[0]);
  },
};
