import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

describe('API contract (no database needed)', () => {
  it('rejects unauthenticated calls with an empty 401', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
    expect(res.text).toBe('');
  });

  it('rejects a token with the wrong signature', async () => {
    const token = jwt.sign({ email: 'a@b.c' }, 'some-other-secret-some-other-secret', {
      subject: 'x',
      issuer: 'VijayDairy',
      audience: 'VijayDairyClients',
    });
    const res = await request(app).get('/api/invoices').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('login validation returns the error envelope', async () => {
    const res = await request(app).post('/api/auth/login').send({ Email: '', Password: '' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: true,
      statusCode: 400,
      messageId: "'Email' must not be empty. 'Password' must not be empty.",
      messageText: "'Email' must not be empty. 'Password' must not be empty.",
    });
  });

  it('a non-UUID id on the public route is a 404', async () => {
    const res = await request(app).get('/api/public/invoices/not-a-guid');
    expect(res.status).toBe(404);
  });

  it('malformed JSON is a 400 envelope', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });

  it('validates a new invoice before touching the database (PascalCase payload accepted)', async () => {
    const token = jwt.sign({ email: 'a@b.c' }, process.env.JWT_SECRET!, {
      subject: '00000000-0000-0000-0000-000000000001',
      issuer: 'VijayDairy',
      audience: 'VijayDairyClients',
    });
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ Items: [{ ProductId: 'p', Name: 'Chocolate', Unit: 'PCS', Price: 20, SellingMode: 'AMOUNT', Amount: 100 }] });
    expect(res.status).toBe(400);
    expect(res.body.messageText).toBe('Chocolate: PCS products can only be sold by quantity.');
  });
});
