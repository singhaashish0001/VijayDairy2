import 'dotenv/config';

const list = (value: string | undefined, fallback: string[]) =>
  value ? value.split(',').map((s) => s.trim()).filter(Boolean) : fallback;

export const config = {
  port: Number(process.env.PORT ?? 5227),
  corsOrigins: list(process.env.CORS_ORIGINS, ['http://localhost:5173', 'http://localhost:5175']),
  databaseUrl: process.env.DATABASE_URL ?? '',
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    issuer: process.env.JWT_ISSUER ?? 'VijayDairy',
    audience: process.env.JWT_AUDIENCE ?? 'VijayDairyClients',
    expiryHours: Number(process.env.JWT_EXPIRY_HOURS ?? 12),
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@vijaydairy.com',
    password: process.env.ADMIN_PASSWORD ?? '',
    name: process.env.ADMIN_NAME ?? 'Admin',
  },
};
