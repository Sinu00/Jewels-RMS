-- AlterEnum: RentalStatus
ALTER TYPE "RentalStatus" ADD VALUE IF NOT EXISTS 'BOOKED';
ALTER TYPE "RentalStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- CreateEnum: PaymentPlan
CREATE TYPE "PaymentPlan" AS ENUM ('HALF_ADVANCE', 'FULL_RENT_DEFER_DEPOSIT', 'FULL_UPFRONT');

-- AlterEnum: PaymentType
ALTER TYPE "PaymentType" ADD VALUE IF NOT EXISTS 'RENTAL_ADVANCE';
ALTER TYPE "PaymentType" ADD VALUE IF NOT EXISTS 'RENTAL_BALANCE';

-- AlterTable: rentals
ALTER TABLE "rentals" ADD COLUMN IF NOT EXISTS "paymentPlan" "PaymentPlan" NOT NULL DEFAULT 'FULL_UPFRONT';
ALTER TABLE "rentals" ADD COLUMN IF NOT EXISTS "totalRentalAmount" DECIMAL(10,2);
ALTER TABLE "rentals" ADD COLUMN IF NOT EXISTS "depositCollected" BOOLEAN NOT NULL DEFAULT false;

-- Backfill totalRentalAmount from items for existing rows
UPDATE "rentals" r
SET "totalRentalAmount" = COALESCE(
  (
    SELECT SUM(ri."ratePerDay" * GREATEST(1, (r."dueDate" - r."startDate")))
    FROM "rental_items" ri
    WHERE ri."rentalId" = r.id
  ),
  0
)
WHERE "totalRentalAmount" IS NULL;

ALTER TABLE "rentals" ALTER COLUMN "totalRentalAmount" SET NOT NULL;

-- Existing active rentals: mark deposit collected if deposit payment exists
UPDATE "rentals" r
SET "depositCollected" = true
WHERE EXISTS (
  SELECT 1 FROM "payments" p
  WHERE p."rentalId" = r.id AND p.type = 'DEPOSIT'
);

-- Existing non-returned rentals created before prebooking: treat as ACTIVE if they were active/overdue/extended
UPDATE "rentals"
SET "status" = 'ACTIVE'
WHERE "status" IN ('ACTIVE', 'OVERDUE', 'EXTENDED');
