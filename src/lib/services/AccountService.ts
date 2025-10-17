// src/lib/services/AccountService.ts
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../prisma';
import { TransactionType, TransactionStatus, UserRole } from '@prisma/client';
import { logAudit } from './EscrowService';
import { generateUniqueRef } from '../utils';

export class AccountService {

    /**
     * Seller requests a withdrawal of available balance.
     * ACID: Uses a transaction to ensure balance deduction and withdrawal record creation are atomic.
     */
    static async requestWithdrawal(sellerId: string, amount: number, method: 'MPESA' | 'BANK', details: any) {
        const amountDecimal = new Decimal(amount);
        
        return prisma.$transaction(async (tx) => {
            // 1. Lock and check Seller's balance
            const seller = await tx.user.findUniqueOrThrow({
                where: { id: sellerId }
            });

            if (seller.balance.lessThan(amountDecimal)) {
                throw new Error('Insufficient available balance for withdrawal.');
            }

            // 2. Deduct funds from Seller's balance (Locking the funds)
            const newSellerBalance = seller.balance.minus(amountDecimal);
            await tx.user.update({
                where: { id: sellerId },
                data: { balance: newSellerBalance }
            });

            // 3. Create the PENDING Withdrawal Transaction
            const withdrawalRef = generateUniqueRef('WDR');
            const withdrawalTx = await tx.transaction.create({
                data: {
                    userId: sellerId,
                    type: TransactionType.WITHDRAWAL,
                    status: TransactionStatus.PENDING, // Admin/Auto-processing will move it to COMPLETED/FAILED
                    amount: amountDecimal.negated(), // Negative for deduction
                    details: { method, ...details },
                    externalRef: withdrawalRef,
                }
            });

            // 4. Audit Log
            await logAudit(tx, sellerId, 'WITHDRAWAL_REQUESTED', withdrawalTx.id, { 
                amount, 
                oldBalance: seller.balance, 
                newBalance: newSellerBalance 
            });
            
            return withdrawalTx;
        });
    }

    // ⚠️ MpesaService implementation needed for actual disbursement (stubbed here)
}