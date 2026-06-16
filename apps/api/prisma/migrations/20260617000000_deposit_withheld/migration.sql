-- AlterEnum: add DEPOSIT_WITHHELD so a partial deposit return can record the
-- amount the shop keeps (tracked to accounts as income).
ALTER TYPE "PaymentType" ADD VALUE IF NOT EXISTS 'DEPOSIT_WITHHELD';
