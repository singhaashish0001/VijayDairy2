import type { NextFunction, Request, Response } from 'express';
import { AppError, ErrorMessages } from '../errors';

const lowerFirst = (key: string) => (key.length > 0 ? key[0].toLowerCase() + key.slice(1) : key);

/**
 * The frontend sends PascalCase payloads (Email, ShopName, Items[{ProductId...}]) and the .NET model binder was
 * case-insensitive. Normalising the first letter of every key lets the handlers read camelCase only.
 */
export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [lowerFirst(k), camelizeKeys(v)]));
  }
  return value;
}

export function camelizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') req.body = camelizeKeys(req.body);
  next();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mirrors the `{id:guid}` route constraint: a non-UUID id simply does not match (404). */
export function uuidParam(req: Request, res: Response, next: NextFunction, id: string) {
  if (!UUID_RE.test(id)) {
    res.status(404).end();
    return;
  }
  next();
}

const envelope = (status: number, messageId: string, messageText: string) => ({
  error: true,
  statusCode: status,
  messageId,
  messageText,
});

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json(envelope(err.status, err.messageId, err.messageText));
    return;
  }
  // Malformed JSON body (body-parser) or an unexpected multipart field (multer).
  const e = err as { type?: string; name?: string };
  if (e?.type === 'entity.parse.failed' || e?.name === 'MulterError') {
    res.status(400).json(envelope(400, 'InvalidRequest', ErrorMessages.InvalidRequest));
    return;
  }
  console.error('Unhandled exception:', err);
  res.status(500).json(envelope(500, 'SomethingWentWrong', ErrorMessages.SomethingWentWrong));
}
