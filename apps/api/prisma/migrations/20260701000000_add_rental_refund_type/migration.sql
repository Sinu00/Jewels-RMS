-- Rent advances can now be refunded when a booking is cancelled. The refund is
-- stored as a negative-amount payment of this type so it nets against rent income
-- everywhere rent totals are summed.
ALTER TYPE "PaymentType" ADD VALUE 'RENTAL_REFUND';
