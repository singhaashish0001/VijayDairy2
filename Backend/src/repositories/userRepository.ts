import { getPool } from '../db';
import type { User } from '../types';

const COLUMNS = 'id, email, password_hash, name, role, created_at';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (row: any): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  name: row.name,
  role: row.role,
  createdAt: row.created_at,
});

export const userRepository = {
  async getByEmail(email: string): Promise<User | null> {
    const { rows } = await getPool().query(`SELECT ${COLUMNS} FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
    return rows[0] ? map(rows[0]) : null;
  },

  async getById(id: string): Promise<User | null> {
    const { rows } = await getPool().query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] ? map(rows[0]) : null;
  },

  async create(user: Pick<User, 'email' | 'passwordHash' | 'name' | 'role'>): Promise<User> {
    const { rows } = await getPool().query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [user.email, user.passwordHash, user.name, user.role],
    );
    return map(rows[0]);
  },
};
