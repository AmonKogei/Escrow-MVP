import prisma from './prisma';
import { UserRole, Prisma, TransactionStatus, TransactionType } from '@prisma/client';

export default async function runSeedLocal() {
  try {
    const mod = await import('bcryptjs');
    const bcrypt = (mod && (mod.default ?? mod));
    const passwordHash = bcrypt.hashSync('password123', 10);

    const admin = await prisma.user.upsert({ where: { email: 'admin@escrow.co.ke' }, update: {}, create: { id: 'admin-uuid', email: 'admin@escrow.co.ke', passwordHash, role: UserRole.ADMIN, balance: 10000.00 } });
    const seller = await prisma.user.upsert({ where: { email: 'seller@trade.co.ke' }, update: {}, create: { id: 'seller-uuid', email: 'seller@trade.co.ke', passwordHash, role: UserRole.SELLER, balance: 0.00 } });
    const buyer = await prisma.user.upsert({ where: { email: 'buyer@trade.co.ke' }, update: {}, create: { id: 'buyer-uuid', email: 'buyer@trade.co.ke', passwordHash, role: UserRole.BUYER, balance: 5000.00 } });

    await prisma.user.updateMany({ where: { id: { in: [admin.id, seller.id, buyer.id] } }, data: {} });
    await prisma.user.update({ where: { id: admin.id }, data: { balance: 10000.00 } });
    await prisma.user.update({ where: { id: seller.id }, data: { balance: 0.00 } });
    await prisma.user.update({ where: { id: buyer.id }, data: { balance: 5000.00 } });

    const depositRef = `DEP-${Date.now()}`;
    await prisma.transaction.create({ data: { userId: buyer.id, type: TransactionType.DEPOSIT, status: TransactionStatus.PENDING, amount: 1000.00, details: { channel: 'MPESA', instruction: process.env.MPESA_PAYBILL || '123456' }, externalRef: depositRef } });

    const escrowAmount = 1000.00;
    const existing = await prisma.escrow.findFirst({ where: { buyerId: buyer.id, amount: new Prisma.Decimal(escrowAmount) } });
    let sampleEscrow = existing;
    if (!existing) {
      await prisma.$transaction(async (tx) => {
        const b = await tx.user.findUniqueOrThrow({ where: { id: buyer.id } });
        if (b.balance.lessThan(new Prisma.Decimal(escrowAmount))) throw new Error('Insufficient balance to create escrow during seed.');
        await tx.user.update({ where: { id: buyer.id }, data: { balance: { decrement: escrowAmount } } });
        sampleEscrow = await tx.escrow.create({ data: { buyerId: buyer.id, sellerId: seller.id, amount: escrowAmount, description: 'Trade for 1 BTC via P2P', status: 'HOLD' } });
        await tx.transaction.create({ data: { userId: buyer.id, type: TransactionType.ESCROW_LOCK, status: TransactionStatus.COMPLETED, amount: new Prisma.Decimal(escrowAmount).negated(), details: { escrowId: sampleEscrow.id }, escrowId: sampleEscrow.id } });
      });
    }

    return { ok: true, adminId: admin.id, buyerId: buyer.id, sellerId: seller.id, escrowId: sampleEscrow?.id };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
}
