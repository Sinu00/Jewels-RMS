-- AlterTable: rental_extensions — record the extra rental charge for an extension
ALTER TABLE "rental_extensions" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(10,2);
