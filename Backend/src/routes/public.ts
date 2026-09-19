import { Router } from 'express';
import { ok } from '../envelope';
import { notFound } from '../errors';
import { uuidParam } from '../middleware/common';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { settingsRepository } from '../repositories/settingsRepository';
import { toInvoiceVM } from '../services/invoiceService';

export const publicRouter = Router();
publicRouter.param('id', uuidParam);

/** Anonymous share link for an invoice. Deliberately omits inventoryEnabled from the settings. */
publicRouter.get('/invoices/:id', async (req, res) => {
  const invoice = await invoiceRepository.getById(String(req.params.id));
  if (!invoice) throw notFound();
  const settings = await settingsRepository.get();
  res.json(
    ok({
      invoice: toInvoiceVM(invoice),
      settings: {
        shopName: settings.shopName,
        address: settings.address,
        phone: settings.phone,
        gstNumber: settings.gstNumber,
        footerNote: settings.footerNote,
      },
    }),
  );
});
