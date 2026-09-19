import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ok } from '../envelope';
import { invalidLogin, unauthorized, validation } from '../errors';
import { requireAuth } from '../middleware/auth';
import { userRepository } from '../repositories/userRepository';
import type { User } from '../types';

export const authRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toUserVM = (u: User) => ({ id: u.id, email: u.email, name: u.name, role: u.role });

function createToken(user: User): string {
  return jwt.sign({ email: user.email, name: user.name, role: user.role }, config.jwt.secret, {
    algorithm: 'HS256',
    subject: user.id,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    expiresIn: Math.round(config.jwt.expiryHours * 3600),
  });
}

authRouter.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const failures: string[] = [];
  if (email.trim() === '') failures.push("'Email' must not be empty.");
  if (password.trim() === '') failures.push("'Password' must not be empty.");
  if (failures.length > 0) throw validation(failures.join(' '));

  const user = await userRepository.getByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw invalidLogin();

  res.json(ok({ token: createToken(user), user: toUserVM(user) }));
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const id = req.userId;
  const user = id && UUID_RE.test(id) ? await userRepository.getById(id) : null;
  if (!user) throw unauthorized();
  res.json(ok(toUserVM(user)));
});

/** Stateless JWT: logout is client-side only; this endpoint just acknowledges (bare body, no envelope). */
authRouter.post('/logout', requireAuth, (_req, res) => {
  res.json({ message: 'Logged out' });
});
