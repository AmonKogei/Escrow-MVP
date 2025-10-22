// src/lib/utils.ts
import { UserRole } from '@prisma/client';
import prisma from './prisma';
import { verifySession } from './session';

// ⚠️ SECURITY NOTE: In production, this would securely parse a JWT from the request
// and validate it against the database/cache. This is a STUB for local testing.
export const authenticateUser = async (request: Request, requiredRole: UserRole | 'ANY' = 'ANY') => {
    // Prefer reading a server cookie (set by the login route) for authentication
    try {
        const cookieHeader = (request.headers && (request.headers as any).get && (request.headers as any).get('cookie')) || '';
        const cookies = cookieHeader.split(';').map(s => s.trim()).filter(Boolean);
        const cookieMap: Record<string, string> = {};
        for (const c of cookies) {
            const [k, ...rest] = c.split('=');
            cookieMap[k] = rest.join('=');
        }

        const raw = cookieMap['escrow_user'];
        if (raw) {
            const secret = process.env.SESSION_SECRET || '';
            const parsed = await verifySession(raw, secret);
            if (!parsed) throw new Error('Authentication failed: invalid session cookie');
            const userId = parsed.id;
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true } });
            if (!user) throw new Error('User not found');
            if (requiredRole !== 'ANY' && user.role !== requiredRole) {
                throw new Error(`Authorization failed: Role ${user.role} is not permitted. Required: ${requiredRole}.`);
            }
            return user;
        }

        // Fallback for legacy/stub flows: allow body userId for testing
        const body = await request.clone().json().catch(() => ({})); // Clone to read the body without consuming it
        const userId = (body as any).userId;
        if (!userId) {
            throw new Error('Authentication failed: Missing userId in request body or session cookie.');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, email: true }
        });

        if (!user) {
            throw new Error('Authentication failed: User not found.');
        }

        if (requiredRole !== 'ANY' && user.role !== requiredRole) {
            throw new Error(`Authorization failed: Role ${user.role} is not permitted. Required: ${requiredRole}.`);
        }

        return user;
    } catch (err) {
        throw err;
    }
};

// Simple unique reference generator (BillRefNumber)
export const generateUniqueRef = (prefix: string = 'REF') => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
};