// src/app/api/escrows/route.ts
import { EscrowService } from '../../../lib/services/EscrowService';
import { authenticateUser } from '../../../lib/utils';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
    try {
        // Auth Stub: Ensure user is a Buyer
        const { id: buyerId } = await authenticateUser(request, UserRole.BUYER);
        
        const { sellerId, amount, description } = await request.json();

        if (!sellerId || !amount || !description) {
            return new Response(JSON.stringify({ message: 'Missing required fields: sellerId, amount, description' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // 1. Call the core service logic
        const escrow = await EscrowService.createEscrow(buyerId, sellerId, parseFloat(amount), description);

        return new Response(JSON.stringify({
            message: 'Escrow created and funds locked successfully.',
            escrow,
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Create escrow error:', error?.message || error);
        return new Response(JSON.stringify({ message: error?.message || 'Failed to create escrow' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}