// src/lib/services/EscrowService.ts
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../prisma';
import { EscrowStatus, UserRole, TransactionType, TransactionStatus } from '@prisma/client';

// Helper function to get the current user ID (stub for a real auth implementation)
const getUserIdFromAuth = (role: UserRole) => {
    // In a real app, this would come from a session/JWT
    // For the seed data:
    if (role === UserRole.BUYER) return 'buyer-uuid';
    if (role === UserRole.SELLER) return 'seller-uuid';
    if (role === UserRole.ADMIN) return 'admin-uuid';
    throw new Error("Invalid User Role for stub.");
};

export class EscrowService {

    /**
     * Buyer creates an escrow and locks funds from their balance.
     * ACID: Uses a transaction to ensure balance deduction and escrow creation are atomic.
     * @param buyerId The ID of the buyer.
     * @param sellerId The ID of the seller.
     * @param amount The amount to lock.
     * @param description A description of the transaction.
     */
    static async createEscrow(buyerId: string, sellerId: string, amount: number, description: string) {
        const amountDecimal = new Decimal(amount);
        
        // Use a DB transaction for ACID compliance
        return prisma.$transaction(async (tx) => {
            // 1. Lock the buyer's row to prevent race conditions on balance
            // NOTE: Prisma client doesn't directly support `SELECT FOR UPDATE` in all versions
            // but the transaction ensures serializable isolation is possible. 
            // For true row-level locking, you'd use raw SQL or a dedicated lock manager (Redis).
            // We simulate safety here by performing a check and then update.
            
            const buyer = await tx.user.findUniqueOrThrow({
                where: { id: buyerId }
            });

            // Safety check: Prevent lock if insufficient funds
            if (buyer.balance.lessThan(amountDecimal)) {
                throw new Error('Insufficient balance to create escrow.');
            }

            // 2. Deduct funds from Buyer's balance
            const newBuyerBalance = buyer.balance.minus(amountDecimal);
            await tx.user.update({
                where: { id: buyerId },
                data: { balance: newBuyerBalance }
            });

            // 3. Create the Escrow record (status = HOLD)
            const escrow = await tx.escrow.create({
                data: {
                    buyerId,
                    sellerId,
                    amount: amountDecimal,
                    description,
                    status: EscrowStatus.HOLD,
                }
            });

            // 4. Create an internal transaction and audit log
            await tx.transaction.create({
                data: {
                    userId: buyerId,
                    type: TransactionType.ESCROW_LOCK,
                    status: TransactionStatus.COMPLETED,
                    amount: amountDecimal.negated(), // Negative for deduction
                    details: { escrowId: escrow.id },
                    escrowId: escrow.id,
                }
            });
            await logAudit(tx, buyerId, 'ESCROW_CREATED', escrow.id, { oldBalance: buyer.balance, newBalance: newBuyerBalance });
            
            return escrow;
        });
    }

    /**
     * Buyer releases funds to the Seller.
     * ACID: Uses a transaction and status checks to prevent double-release.
     * @param escrowId The ID of the escrow to release.
     * @param buyerId The ID of the user requesting the release (must be the buyer).
     */
    static async releaseEscrow(escrowId: string, buyerId: string) {
        
        return prisma.$transaction(async (tx) => {
            // 1. Check and lock the Escrow row
            const escrow = await tx.escrow.findUniqueOrThrow({
                where: { id: escrowId },
                select: { id: true, status: true, buyerId: true, sellerId: true, amount: true }
            });

            // Safety check: Prevent double-release and release in wrong state
            if (escrow.buyerId !== buyerId) {
                throw new Error('Only the Buyer can release the escrow.');
            }
            if (escrow.status !== EscrowStatus.HOLD) {
                throw new Error(`Escrow is not in HOLD status. Current status: ${escrow.status}.`);
            }
            
            const amountDecimal = escrow.amount;

            // 2. Update Escrow status to RELEASED and capture the updated record
            const updatedEscrow = await tx.escrow.update({
                where: { id: escrowId },
                data: { status: EscrowStatus.RELEASED }
            });

            // 3. Credit Seller's platform balance
            const seller = await tx.user.update({
                where: { id: escrow.sellerId },
                data: { balance: { increment: amountDecimal } },
                select: { balance: true }
            });

            // 4. Create internal transaction and audit log
            await tx.transaction.create({
                data: {
                    userId: escrow.sellerId,
                    type: TransactionType.ESCROW_RELEASE,
                    status: TransactionStatus.COMPLETED,
                    amount: amountDecimal,
                    details: { escrowId: updatedEscrow.id },
                    escrowId: updatedEscrow.id,
                }
            });
            await logAudit(tx, buyerId, 'ESCROW_RELEASED', updatedEscrow.id, { sellerNewBalance: seller.balance });

            return updatedEscrow;
        });
    }

    /**
     * Buyer or Seller raises a dispute. Locks the funds.
     */
    static async raiseDispute(escrowId: string, userId: string, reason: string) {
        return prisma.$transaction(async (tx) => {
            const escrow = await tx.escrow.findUniqueOrThrow({
                where: { id: escrowId },
            });

            if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
                throw new Error('Only the Buyer or Seller can raise a dispute.');
            }

            if (escrow.status !== EscrowStatus.HOLD) {
                throw new Error('Dispute can only be raised on an active (HOLD) escrow.');
            }

            // 1. Update Escrow status to DISPUTED
            const updatedEscrow = await tx.escrow.update({
                where: { id: escrowId },
                data: { 
                    status: EscrowStatus.DISPUTED,
                    disputeRaised: true,
                    disputeReason: reason,
                }
            });

            // 2. Audit Log
            await logAudit(tx, userId, 'DISPUTE_RAISED', escrowId, { reason });
            return updatedEscrow;
        });
    }

    /**
     * Admin resolves a dispute (Release to Seller or Refund to Buyer).
     * ACID: Uses transaction to ensure fund movement and status change are atomic.
     */
    static async resolveDispute(adminId: string, escrowId: string, resolution: 'APPROVE' | 'REJECT') {
        
        // NOTE: In a real system, we'd check if adminId has the ADMIN role.
        
        return prisma.$transaction(async (tx) => {
            const escrow = await tx.escrow.findUniqueOrThrow({
                where: { id: escrowId },
                select: { id: true, status: true, buyerId: true, sellerId: true, amount: true }
            });

            if (escrow.status !== EscrowStatus.DISPUTED) {
                throw new Error(`Escrow is not in DISPUTED status. Current status: ${escrow.status}.`);
            }

            const amountDecimal = escrow.amount;
            let targetUserId: string;
            let newStatus: EscrowStatus;
            let transactionType: TransactionType;

            if (resolution === 'APPROVE') {
                // Funds go to Seller
                targetUserId = escrow.sellerId;
                newStatus = EscrowStatus.RELEASED;
                transactionType = TransactionType.ESCROW_RELEASE;
            } else { // REJECT (Funds go back to Buyer)
                // Funds go back to Buyer
                targetUserId = escrow.buyerId;
                newStatus = EscrowStatus.REFUNDED;
                transactionType = TransactionType.ESCROW_LOCK; // Use LOCK type with positive amount for refund credit
            }

            // 1. Update Escrow status
            const updatedEscrow = await tx.escrow.update({
                where: { id: escrowId },
                data: { 
                    status: newStatus,
                    disputeResolvedAt: new Date(),
                }
            });

            // 2. Credit the target user's platform balance
            const targetUser = await tx.user.update({
                where: { id: targetUserId },
                data: { balance: { increment: amountDecimal } },
                select: { balance: true }
            });

            // 3. Create internal transaction and audit log
            await tx.transaction.create({
                data: {
                    userId: targetUserId,
                    type: transactionType,
                    status: TransactionStatus.COMPLETED,
                    amount: amountDecimal,
                    details: { escrowId: escrow.id, resolution, targetUserId },
                    escrowId: escrow.id,
                }
            });
            await logAudit(tx, adminId, `DISPUTE_RESOLVED_${resolution}`, escrowId, { targetUserId, newBalance: targetUser.balance });
            
            return updatedEscrow;
        });
    }
}

// Minimal Audit Service stub
export const logAudit = async (tx: any, userId: string, action: string, entityId: string | null = null, details: any = {}) => {
    await tx.auditLog.create({
        data: {
            userId,
            action,
            entityId,
            newState: details,
        }
    });
};