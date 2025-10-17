// src/app/api/auth/login/route.ts
export const runtime = 'nodejs';
import prisma from '../../../../lib/prisma';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const { email, password, role } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ message: 'Missing email or password' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Optional role gate (e.g., for admin login)
        if (role && role.toString().toUpperCase() === 'ADMIN' && user.role !== UserRole.ADMIN) {
            return new Response(JSON.stringify({ message: 'Forbidden: admin access required' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({
            message: 'Login successful',
            user: { id: user.id, email: user.email, role: user.role },
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ message: 'Login failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}


