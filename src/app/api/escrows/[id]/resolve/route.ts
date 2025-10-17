// src/app/api/admin/escrows/[id]/resolve/route.ts
import { EscrowService } from '../../../../../lib/services/EscrowService';
import { authenticateUser } from '../../../../../lib/utils';
import { UserRole } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        // ⚠️ CRITICAL Auth Check: Ensure user is an Admin
        const { id: adminId } = await authenticateUser(request, UserRole.ADMIN);
        const escrowId = params.id;
        const { resolution } = await request.json(); // "APPROVE" (to Seller) or "REJECT" (to Buyer)

        if (!['APPROVE', 'REJECT'].includes(resolution)) {
            return new Response(JSON.stringify({ message: 'Invalid resolution status. Must be APPROVE or REJECT.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // 1. Call the core service logic
        const resolvedEscrow = await EscrowService.resolveDispute(adminId, escrowId, resolution as 'APPROVE' | 'REJECT');

        return new Response(JSON.stringify({
            message: `Dispute for escrow ${escrowId} resolved. Funds transferred to ${resolution === 'APPROVE' ? 'Seller' : 'Buyer'}.`,
            escrow: resolvedEscrow,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Resolve dispute error:', error?.message || error);
        return new Response(JSON.stringify({ message: error?.message || 'Failed to resolve dispute' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}