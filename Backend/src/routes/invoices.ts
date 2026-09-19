import { Router } from 'express';
import { deletedEnvelope, ok } from '../envelope';
import { notFound } from '../errors';
import { uuidParam } from '../middleware/common';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { settingsRepository } from '../repositories/settingsRepository';
import { buildInvoice, parseInvoiceInput, toInvoiceVM } from '../services/invoiceService';

export const invoicesRouter = Router();
invoicesRouter.param('id', uuidParam);

invoicesRouter.get('/', async (_req, res) => {
  res.json(ok((await invoiceRepository.getAll()).map(toInvoiceVM)));
});

invoicesRouter.get('/:id', async (req, res) => {
  const invoice = await invoiceRepository.getById(String(req.params.id));
  if (!invoice) throw notFound();
  res.json(ok(toInvoiceVM(invoice)));
});

invoicesRouter.post('/', async (req, res) => {
  const input = parseInvoiceInput(req.body);
  const invoice = buildInvoice(input);
  const settings = await settingsRepository.get();
  const created = await invoiceRepository.create(invoice, settings.inventoryEnabled);
  res.json(ok(toInvoiceVM(created), 201));
});

invoicesRouter.delete('/:id', async (req, res) => {
  if (!(await invoiceRepository.remove(String(req.params.id)))) throw notFound();
  res.json(deletedEnvelope());
});
