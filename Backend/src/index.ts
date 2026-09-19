import { createApp } from './app';
import { config } from './config';
import { seedAdmin } from './seed';

async function main() {
  if (!config.jwt.secret) throw new Error('JWT_SECRET is required');
  if (!config.databaseUrl) throw new Error('DATABASE_URL is required');

  await seedAdmin();
  createApp().listen(config.port, () => console.log(`Vijay Dairy API listening on http://localhost:${config.port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
