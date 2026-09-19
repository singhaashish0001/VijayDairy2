import type { NextFunction, Request, Response } from 'express';

const FUNCTION_PREFIX = '/.netlify/functions/api';

/**
 * Maps the path a serverless host hands us onto the app's `/api/...` routes. Netlify rewrites `/api/*` to
 * `/.netlify/functions/api/*`; depending on how the request reaches the function the path may arrive as `/api/x`,
 * `/.netlify/functions/api/x`, `/.netlify/functions/api/api/x` or `/x` — all become `/api/x`.
 */
export function normalizeApiPath(url: string): string {
  let out = url.startsWith(FUNCTION_PREFIX) ? url.slice(FUNCTION_PREFIX.length) : url;
  if (!out.startsWith('/')) out = '/' + out;
  if (out !== '/api' && !out.startsWith('/api/') && !out.startsWith('/api?')) out = '/api' + out;
  return out.replace(/^\/api\/api(\/|\?|$)/, '/api$1'); // collapse a doubled prefix
}

/** Only used when the app runs behind a function (see serverless.ts). */
export function pathNormalize(req: Request, _res: Response, next: NextFunction) {
  req.url = normalizeApiPath(req.url);
  next();
}
