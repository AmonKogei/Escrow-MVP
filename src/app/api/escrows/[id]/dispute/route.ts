// src/app/api/escrows/[id]/dispute/route.ts
import { EscrowService } from '../../../../../lib/services/EscrowService';
import { authenticateUser } from '../../../../../lib/utils';

export async function POST(request: Request, context: any) {
    try {
        // Auth Stub: Check if the user is authorized (buyer or seller of the escrow)
        const { id: userId } = await authenticateUser(request, 'ANY');
        const escrowId = context?.params?.id;
        const { reason } = await request.json();

        if (!reason) {
            return new Response(JSON.stringify({ message: 'Dispute reason is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // 1. Call the core service logic
        const disputedEscrow = await EscrowService.raiseDispute(escrowId, userId, reason);

        return new Response(JSON.stringify({
            message: `Dispute raised successfully for escrow ${escrowId}. Funds are now locked.`,
            escrow: disputedEscrow,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Raise dispute error:', error?.message || error);
        return new Response(JSON.stringify({ message: error?.message || 'Failed to raise dispute' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}