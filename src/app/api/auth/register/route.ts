// src/app/api/auth/register/route.ts
import prisma from '../../../../lib/prisma';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const { email, password, role } = await request.json();

        if (!email || !password || !role) {
            return new Response(JSON.stringify({ message: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const roleEnum = role.toUpperCase() as UserRole;
        if (!Object.values(UserRole).includes(roleEnum) || roleEnum === UserRole.ADMIN) {
            // Prevent public registration as ADMIN
            return new Response(JSON.stringify({ message: 'Invalid or forbidden role' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: roleEnum,
            },
            select: { id: true, email: true, role: true, balance: true }
        });

        // ⚠️ In a real app, you would generate and return a JWT here
        return new Response(JSON.stringify({
            message: 'User registered successfully',
            user,
            temp_token: 'STUB_JWT_123',
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        if (error && error.code === 'P2002') { // Prisma unique constraint violation
            return new Response(JSON.stringify({ message: 'Email already in use' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        console.error('Registration error:', error);
        return new Response(JSON.stringify({ message: 'Registration failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}