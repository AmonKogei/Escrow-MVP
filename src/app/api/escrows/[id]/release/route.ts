// src/app/api/escrows/[id]/release/route.ts
import { EscrowService } from '../../../../../lib/services/EscrowService';
import { authenticateUser } from '../../../../../lib/utils';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        // Auth Stub: Check if the user is authorized (must be the buyer of the escrow)
        const { id: userId } = await authenticateUser(request, 'ANY');
        const escrowId = params.id;
        
        // 1. Call the core service logic
        const releasedEscrow = await EscrowService.releaseEscrow(escrowId, userId);

        return new Response(JSON.stringify({
            message: `Funds for escrow ${escrowId} successfully released to seller.`,
            escrow: releasedEscrow,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Release escrow error:', error?.message || error);
        // Return 403 if unauthorized, 400 if state is wrong
        const status = error?.message && (error.message.includes('Buyer can only release') || error.message.includes('not in HOLD')) ? 400 : 500;
        return new Response(JSON.stringify({ message: error?.message || 'Failed to release escrow' }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}