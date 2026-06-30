import type { PaymentMethod, PaymentType } from '@prisma/client'

export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'UPI', 'BANK_TRANSFER']
export const PAYMENT_TYPES: PaymentType[] = [
  'RENTAL',
  'RENTAL_ADVANCE',
  'RENTAL_BALANCE',
  'RENTAL_REFUND',
  'DEPOSIT',
  'DEPOSIT_REFUND',
  'DEPOSIT_WITHHELD',
  'OTHER',
]

/** Finite number strictly greater than zero. */
export function isPositiveAmount(v: unknown): boolean {
  const n = Number(v)
  return Number.isFinite(n) && n > 0
}

/** Finite number of zero or more. */
export function isNonNegativeAmount(v: unknown): boolean {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0
}
