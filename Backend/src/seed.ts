import bcrypt from 'bcryptjs';
import { config } from './config';
import { userRepository } from './repositories/userRepository';

/** Seeds the admin user if none exists with the configured email (needs ADMIN_PASSWORD). Safe to call repeatedly. */
export async function seedAdmin() {
  const { email, password, name } = config.admin;
  if (!password) {
    console.warn('ADMIN_PASSWORD is not set - skipping admin seeding.');
    return;
  }
  if (await userRepository.getByEmail(email)) return;
  await userRepository.create({ email, passwordHash: await bcrypt.hash(password, 11), name, role: 'admin' });
  console.log(`Seeded admin user ${email}`);
}
