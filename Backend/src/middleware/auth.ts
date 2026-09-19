import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

/** ASP.NET's default JWT validation allowed 5 minutes of clock skew. */
const CLOCK_TOLERANCE_SECONDS = 300;

/** Bearer-token guard. Failures return an empty 401, like the ASP.NET authentication layer did. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !/^Bearer /i.test(header)) {
    res.status(401).end();
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7).trim(), config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
    req.userId = typeof payload === 'object' ? (payload.sub as string | undefined) : undefined;
    next();
  } catch {
    res.status(401).end();
  }
}
