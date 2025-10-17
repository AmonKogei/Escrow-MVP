// src/app/api/webhooks/mpesa/route.ts
import prisma from '../../../../lib/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// STUB - This is the entry point for the Daraja C2B/STK Confirmation callback
export async function POST(request: Request) {
    const data = await request.json();
    
    // 1. **Security Check**: In a real implementation, you must validate the Daraja security credentials 
    // and check the IP to ensure it comes from Safaricom.
    // Also, respond with the required Daraja 'C2B Response' format to acknowledge receipt.
    
    // --- Simulate Daraja Payload Structure (simplified) ---
    const { 
        TransactionType: paymentType, 
        TransID, 
        TransTime, 
        TransAmount, 
        BusinessShortCode, 
        BillRefNumber, // This is the unique deposit reference we provided
        MSISDN 
    } = data.stkCallback?.CallbackMetadata?.Item.reduce((acc: any, item: any) => {
        acc[item.Name] = item.Value;
        return acc;
    }, {}) || data; // Simple fallback for C2B

    if (!TransID || !BillRefNumber || !TransAmount || !MSISDN) {
        console.error('Incomplete M-Pesa data received:', data);
        return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid payload' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const externalRef = BillRefNumber;
    const amountDecimal = new Decimal(TransAmount);

    try {
        // Use a transaction for ACID compliance
        await prisma.$transaction(async (tx) => {
            // 2. Check for duplicate processing using the unique transaction ID (TransID or a combination)
            const existingTx = await tx.transaction.findUnique({
                where: { externalRef: TransID }
            });

            if (existingTx) {
                // **Safety**: Double-processing prevention. Log and exit gracefully.
                console.warn(`Duplicate M-Pesa callback for TransID: ${TransID}`);
                return; 
            }

            // 3. Find the associated user/deposit request (using the unique BillRefNumber)
            // In a real app, you'd map the BillRefNumber (unique deposit ref) back to a Buyer ID.
            // For this MVP, we'll assume the BillRefNumber is tied to a user ID for simplicity.
            const depositRequest = await tx.transaction.findFirst({
                where: { 
                    externalRef: externalRef, 
                    type: TransactionType.DEPOSIT,
                    status: TransactionStatus.PENDING 
                },
                select: { userId: true, id: true }
            });
            
            if (!depositRequest) {
                // Could be an unlinked deposit or a reference we didn't generate
                console.error(`No pending deposit request found for ref: ${externalRef}`);
                // In a production environment, you might hold these funds for manual review.
                throw new Error('Unlinked deposit reference.');
            }

            const buyerId = depositRequest.userId;

            // 4. Update the Buyer's balance and the Transaction record
            const updatedUser = await tx.user.update({
                where: { id: buyerId },
                data: { balance: { increment: amountDecimal } },
            });
            
            await tx.transaction.update({
                where: { id: depositRequest.id },
                data: {
                    status: TransactionStatus.COMPLETED,
                    amount: amountDecimal,
                    externalRef: TransID, // Use the *actual* TransID for the final record
                    details: { ...data, msisdn: MSISDN },
                }
            });

            // 5. Audit Log for safety (inline to avoid missing service import)
            await tx.auditLog.create({
                data: {
                    userId: buyerId,
                    action: 'DEPOSIT_CREDIT',
                    entityId: depositRequest.id,
                    // Prisma JSON fields accept undefined but not null in TS types here
                    newState: { TransID, amount: TransAmount, newBalance: updatedUser.balance },
                },
            });
        });

        // Daraja expects this response format on success
        return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accept' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error processing M-Pesa webhook:', error);
        // Fail gracefully to Daraja
        return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}