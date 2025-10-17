// src/app/api/deposits/request/route.ts
import prisma from '../../../../lib/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { generateUniqueRef, authenticateUser } from '../../../../lib/utils';

export async function POST(request: Request) {
    try {
        // Auth Stub: Get buyer info
        const { id: buyerId } = await authenticateUser(request, 'BUYER');
        const { method, amount } = await request.json(); // amount is for tracking/pre-deposit

        if (!method || !['MPESA', 'BANK'].includes(method)) {
            return new Response(JSON.stringify({ message: 'Invalid deposit method' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 1. Generate unique reference (used as M-Pesa BillRefNumber)
        const depositRef = generateUniqueRef('DEP');

        // 2. Create PENDING transaction record
        const transaction = await prisma.transaction.create({
            data: {
                userId: buyerId,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.PENDING,
                amount: amount ? parseFloat(amount) : 0.00, // Amount is often TBD until confirmation
                details: { method, note: 'Awaiting external confirmation' },
                externalRef: depositRef,
            }
        });

        // 3. Return instructions
        const instructions = method === 'MPESA' ? 
            {
                paybill: process.env.MPESA_PAYBILL, // from .env
                accountNumber: depositRef,
                instructions: `Go to M-Pesa -> Lipa Na M-Pesa -> Pay Bill. Use Business No: ${process.env.MPESA_PAYBILL} and Account No: ${depositRef}.`,
            } : 
            {
                bankName: 'Equity Bank Kenya',
                accountName: 'Escrow Services Ltd',
                accountNumber: '1234567890',
                reference: depositRef,
                instructions: `Deposit to our bank account using the reference: ${depositRef}.`,
            };

        return new Response(JSON.stringify({
            message: 'Deposit instruction generated',
            depositReference: depositRef,
            method,
            instructions,
            transactionId: transaction.id,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Deposit request error:', error?.message || error);
        return new Response(JSON.stringify({ message: error?.message || 'Failed to generate deposit instruction' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}