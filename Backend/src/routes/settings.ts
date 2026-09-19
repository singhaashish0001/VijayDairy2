import { Router } from 'express';
import { ok } from '../envelope';
import { validation } from '../errors';
import { DEFAULT_FOOTER_NOTE, settingsRepository } from '../repositories/settingsRepository';

export const settingsRouter = Router();

settingsRouter.get('/', async (_req, res) => {
  res.json(ok(await settingsRepository.get()));
});

settingsRouter.put('/', async (req, res) => {
  const body = req.body ?? {};
  const text = (v: unknown) => (typeof v === 'string' ? v : '');

  const shopName = text(body.shopName);
  if (shopName.trim() === '') throw validation("'Shop Name' must not be empty.");

  const footerNote = text(body.footerNote);
  const updated = await settingsRepository.upsert({
    shopName,
    address: text(body.address),
    phone: text(body.phone),
    gstNumber: text(body.gstNumber),
    footerNote: footerNote.trim() === '' ? DEFAULT_FOOTER_NOTE : footerNote,
    inventoryEnabled: body.inventoryEnabled === true,
  });
  res.json(ok(updated));
});
