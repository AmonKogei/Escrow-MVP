import { signSession, verifySession } from '../src/lib/session';

describe('session helpers', () => {
  const secret = 'test-secret';
  it('signs and verifies payload', async () => {
    const payload = { id: 'u1', role: 'ADMIN' };
    const signed = await signSession(payload, secret);
    expect(typeof signed).toBe('string');
    const parsed = await verifySession(signed, secret);
    expect(parsed).toEqual(payload);
  });

  it('rejects invalid signature', async () => {
    const payload = { id: 'u1', role: 'ADMIN' };
    const signed = await signSession(payload, secret);
    // Tamper
    const tampered = signed.replace('ADMIN', 'BUYER');
    const parsed = await verifySession(tampered, secret);
    expect(parsed).toBeNull();
  });
});
