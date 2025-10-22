import { createMocks } from 'node-mocks-http';
import handler from '../../src/pages/api/deposits/index';
import { signSession } from '../../src/lib/session';
import prisma from '../../src/lib/prisma';

const SECRET = process.env.SESSION_SECRET || 'dev-secret';

describe('POST /api/deposits', () => {
  test('returns 401 when no session cookie', async () => {
    const { req, res } = createMocks({ method: 'POST', body: { amount: 100 } });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  test('creates deposit when authenticated buyer', async () => {
    // ensure a buyer exists
  let buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } as any });
    if (!buyer) {
      buyer = await prisma.user.create({ data: { email: 'test-buyer@local', role: 'BUYER', passwordHash: 'x' } as any });
    }
    const payload = { id: buyer.id, email: buyer.email, role: 'buyer' };
    const cookie = await signSession(payload, SECRET);
    const { req, res } = createMocks({ method: 'POST', body: { amount: 123 }, headers: { cookie: `session=${cookie}` } });
    await handler(req as any, res as any);
    expect([200,201]).toContain(res._getStatusCode());
  });
});
