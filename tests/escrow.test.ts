// tests/escrow.test.ts
// Minimal globals to satisfy TypeScript without installing Jest types in this MVP
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeAll: any;
declare const afterAll: any;
// If DATABASE_URL is not set, skip these DB-dependent tests so unit tests that don't need
// a running Postgres can pass locally. CI should provide DATABASE_URL.
const hasDatabase = !!process.env.DATABASE_URL;
const describeOrSkip = hasDatabase ? describe : describe.skip;
import { EscrowService } from '../src/lib/services/EscrowService'; // Import the core service logic
import prisma from '../src/lib/prisma';
import { EscrowStatus } from '@prisma/client';

// Helper IDs from the seed script
const BUYER_ID = 'buyer-uuid';
const SELLER_ID = 'seller-uuid';
const ADMIN_ID = 'admin-uuid';

describeOrSkip('Escrow Critical Financial Flows', () => {

    // Helper to get fresh user data
    const getUser = (id: string) => prisma.user.findUniqueOrThrow({ where: { id } });

    // Ensure the database is clean before running tests (optional, but good practice)
    beforeAll(async () => {
        // Run seed or ensure test accounts exist with known balances
        // For simplicity, we assume seed has run and balances are known:
        // Buyer: 4000 (after initial 1000 lock), Seller: 0
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // Test 1: Successful Escrow Creation (Locking Funds)
    it('should successfully create an escrow and lock buyer funds atomically', async () => {
        const initialBuyer = await getUser(BUYER_ID);
        const lockAmount = 500;
        const initialBalance = initialBuyer.balance.toNumber();

        const escrow = await EscrowService.createEscrow(BUYER_ID, SELLER_ID, lockAmount, 'Test lock');
        
        const finalBuyer = await getUser(BUYER_ID);

        expect(escrow.status).toBe(EscrowStatus.HOLD);
        // Check if balance deduction was atomic
        expect(finalBuyer.balance.toNumber()).toBe(initialBalance - lockAmount); 
    });

    // Test 2: Successful Escrow Release
    it('should successfully release funds to seller and update escrow status atomically', async () => {
        const lockAmount = 100;
        // Setup: Create a new escrow
        const initialBuyer = await getUser(BUYER_ID);
        await EscrowService.createEscrow(BUYER_ID, SELLER_ID, lockAmount, 'Test release setup'); 
        
        const initialSeller = await getUser(SELLER_ID);
        const initialSellerBalance = initialSeller.balance.toNumber();
        
        // Action: Release the escrow (Note: we need the ID of the latest escrow)
        const activeEscrow = await prisma.escrow.findFirstOrThrow({ 
            where: { buyerId: BUYER_ID, status: EscrowStatus.HOLD }, 
            orderBy: { createdAt: 'desc' } 
        });

        const releasedEscrow = await EscrowService.releaseEscrow(activeEscrow.id, BUYER_ID);
        
        const finalSeller = await getUser(SELLER_ID);

        // Verification
        expect(releasedEscrow.status).toBe(EscrowStatus.RELEASED);
        // Check if seller was credited atomically
        expect(finalSeller.balance.toNumber()).toBe(initialSellerBalance + lockAmount);
    });

    // Test 3: Dispute Resolution (Refund Buyer)
    it('Admin resolve dispute REJECT should refund funds to buyer atomically', async () => {
        const lockAmount = 200;
        // Setup 1: Create a new escrow
        await EscrowService.createEscrow(BUYER_ID, SELLER_ID, lockAmount, 'Test dispute setup'); 
        const activeEscrow = await prisma.escrow.findFirstOrThrow({ 
            where: { buyerId: BUYER_ID, status: EscrowStatus.HOLD }, 
            orderBy: { createdAt: 'desc' } 
        });

        // Setup 2: Raise a dispute
        await EscrowService.raiseDispute(activeEscrow.id, BUYER_ID, 'Dispute for refund test');
        const initialBuyer = await getUser(BUYER_ID);
        const initialBuyerBalance = initialBuyer.balance.toNumber();

        // Action: Admin rejects (Refunds Buyer)
        const resolvedEscrow = await EscrowService.resolveDispute(ADMIN_ID, activeEscrow.id, 'REJECT');

        const finalBuyer = await getUser(BUYER_ID);

        // Verification
        expect(resolvedEscrow.status).toBe(EscrowStatus.REFUNDED);
        // Check if buyer was refunded atomically
        expect(finalBuyer.balance.toNumber()).toBe(initialBuyerBalance + lockAmount); 
    });

    // Test 4: Prevent Double-Release
    it('should prevent double-release and throw an error', async () => {
        const lockAmount = 10;
        // Setup: Create a new escrow
        await EscrowService.createEscrow(BUYER_ID, SELLER_ID, lockAmount, 'Test double-release setup'); 
        const activeEscrow = await prisma.escrow.findFirstOrThrow({ 
            where: { buyerId: BUYER_ID, status: EscrowStatus.HOLD }, 
            orderBy: { createdAt: 'desc' } 
        });

        // 1st Release (Success)
        await EscrowService.releaseEscrow(activeEscrow.id, BUYER_ID);

        // 2nd Release (Should fail)
        await expect(EscrowService.releaseEscrow(activeEscrow.id, BUYER_ID)).rejects.toThrow(/Escrow is not in HOLD status/);
    });
});