// src/app/api/withdrawals/route.ts
import { NextResponse } from 'next/server';
import { AccountService } from '@/lib/services/AccountService';
import { authenticateUser } from '@/lib/utils';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
    try {
        // Auth Stub: Ensure user is a Seller
        const { id: sellerId } = await authenticateUser(request, UserRole.SELLER);
        const { amount, method, details } = await request.json();

        if (!amount || !method || !details) {
            return NextResponse.json({ message: 'Missing required fields: amount, method, details' }, { status: 400 });
        }

        if (!['MPESA', 'BANK'].includes(method)) {
            return NextResponse.json({ message: 'Invalid withdrawal method' }, { status: 400 });
        }
        
        // 1. Call the core service logic to lock funds and create pending request
        const withdrawalTx = await AccountService.requestWithdrawal(sellerId, parseFloat(amount), method as 'MPESA' | 'BANK', details);

        return NextResponse.json({ 
            message: 'Withdrawal request submitted. Funds are deducted and request is pending admin/auto-approval.',
            withdrawalTx
        }, { status: 202 });

    } catch (error: any) {
        console.error('Withdrawal request error:', error.message);
        return NextResponse.json({ message: error.message || 'Failed to submit withdrawal request' }, { status: 400 });
    }
}