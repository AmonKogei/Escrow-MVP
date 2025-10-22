import { createMocks } from 'node-mocks-http';
import handler from '../../src/pages/api/withdrawals/index';
import { signSession } from '../../src/lib/session';
import prisma from '../../src/lib/prisma';

const SECRET = process.env.SESSION_SECRET || 'dev-secret';

describe('POST /api/withdrawals', () => {
  test('returns 401 when no session cookie', async () => {
    const { req, res } = createMocks({ method: 'POST', body: { amount: 100 } });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  test('creates withdrawal when authenticated seller', async () => {
    // ensure a seller exists
    let seller = await prisma.user.findFirst({ where: { role: 'SELLER' } as any });
    if (!seller) {
      seller = await prisma.user.create({ data: { email: 'test-seller@local', role: 'SELLER', passwordHash: 'x' } as any });
    }
    const payload = { id: seller.id, email: seller.email, role: 'seller' };
    const cookie = await signSession(payload, SECRET);
    const { req, res } = createMocks({ method: 'POST', body: { amount: 123 }, headers: { cookie: `session=${cookie}` } });
    await handler(req as any, res as any);
    expect([200,201]).toContain(res._getStatusCode());
  });
});
