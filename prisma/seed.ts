// prisma/seed.ts
import { PrismaClient, UserRole, Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Test Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@escrow.co.ke' },
    update: {},
    create: {
      id: 'admin-uuid', // Fixed ID for easy testing/auth stubbing
      email: 'admin@escrow.co.ke',
      passwordHash,
      role: UserRole.ADMIN,
      balance: 10000.00,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@trade.co.ke' },
    update: {},
    create: {
      id: 'seller-uuid',
      email: 'seller@trade.co.ke',
      passwordHash,
      role: UserRole.SELLER,
      balance: 0.00,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@trade.co.ke' },
    update: {},
    create: {
      id: 'buyer-uuid',
      email: 'buyer@trade.co.ke',
      passwordHash,
      role: UserRole.BUYER,
      // Start with a balance so they can create an escrow immediately
      balance: 5000.00, 
    },
  });

  console.log({ admin, seller, buyer });

  // 2. Create a pending deposit transaction for the buyer (to simulate the first step)
  const depositRef = `DEP-${Date.now()}`;
  const pendingDeposit = await prisma.transaction.create({
    data: {
      userId: buyer.id,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      amount: 1000.00, // Placeholder
      details: { channel: 'MPESA', instruction: process.env.MPESA_PAYBILL || '123456' },
      externalRef: depositRef,
    }
  });

  console.log(`Created pending deposit request for Buyer. Reference: ${depositRef}`);
  console.log(`Buyer starting balance: ${buyer.balance.toFixed(2)}`);

  // 3. Create a sample Escrow (already locked from Buyer's balance)
  const escrowAmount = 1000.00;
  await prisma.user.update({
    where: { id: buyer.id },
    data: { balance: { decrement: escrowAmount } } // Deduct balance
  });

  const sampleEscrow = await prisma.escrow.create({
    data: {
      buyerId: buyer.id,
      sellerId: seller.id,
      amount: escrowAmount,
      description: 'Trade for 1 BTC via P2P',
      status: 'HOLD',
    },
  });
  
  await prisma.transaction.create({
    data: {
        userId: buyer.id,
        type: TransactionType.ESCROW_LOCK,
        status: TransactionStatus.COMPLETED,
        amount: new Prisma.Decimal(escrowAmount).negated(),
        details: { escrowId: sampleEscrow.id },
        escrowId: sampleEscrow.id,
    }
  });

  console.log(`Created sample Escrow (ID: ${sampleEscrow.id}) with ${escrowAmount} locked.`);
  console.log(`Buyer final starting balance: ${(buyer.balance.minus(escrowAmount)).toFixed(2)}`);
  
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });