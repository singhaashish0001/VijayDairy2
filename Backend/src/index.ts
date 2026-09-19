import bcrypt from 'bcryptjs';
import { createApp } from './app';
import { config } from './config';
import { userRepository } from './repositories/userRepository';

/** Seeds the admin user on startup if none exists with the configured email (needs ADMIN_PASSWORD). */
async function seedAdmin() {
  const { email, password, name } = config.admin;
  if (!password) {
    console.warn('ADMIN_PASSWORD is not set - skipping admin seeding.');
    return;
  }
  if (await userRepository.getByEmail(email)) return;
  await userRepository.create({ email, passwordHash: await bcrypt.hash(password, 11), name, role: 'admin' });
  console.log(`Seeded admin user ${email}`);
}

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
