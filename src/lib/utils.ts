// src/lib/utils.ts
import { UserRole } from '@prisma/client';
import prisma from './prisma';

// ⚠️ SECURITY NOTE: In production, this would securely parse a JWT from the request
// and validate it against the database/cache. This is a STUB for local testing.
export const authenticateUser = async (request: Request, requiredRole: UserRole | 'ANY' = 'ANY') => {
    // For MVP testing, we'll use a simple header/body check for the user ID and role
    const body = await request.clone().json(); // Clone to read the body without consuming it
    const userId = body.userId; // Expecting userId in the body for simplicity

    if (!userId) {
        throw new Error('Authentication failed: Missing userId in request body.');
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
};

// Simple unique reference generator (BillRefNumber)
export const generateUniqueRef = (prefix: string = 'REF') => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
};