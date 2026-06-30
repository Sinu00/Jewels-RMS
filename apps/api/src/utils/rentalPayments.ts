import type { PaymentPlan, PaymentType } from '@prisma/client'

// RENTAL_REFUND is stored as a negative amount (a rent advance handed back on
// cancellation), so including it here makes every rent total — rentalPaidAmount,
// the dashboard's rent revenue, the Accounts income view — net it out for free.
export const RENTAL_INCOME_TYPES: PaymentType[] = [
  'RENTAL',
  'RENTAL_ADVANCE',
  'RENTAL_BALANCE',
  'RENTAL_REFUND',
]

// Income shown on the Accounts page = rent income plus any deposit the shop keeps
// (withheld for damage/late). Kept separate from RENTAL_INCOME_TYPES so rent-due
// math (rentalPaidAmount) stays unaffected.
export const ACCOUNTS_INCOME_TYPES: PaymentType[] = [...RENTAL_INCOME_TYPES, 'DEPOSIT_WITHHELD']

export function sumPaymentsByTypes(
  payments: Array<{ type: PaymentType; amount: unknown }>,
  types: PaymentType[]
): number {
  return payments
    .filter((p) => types.includes(p.type))
    .reduce((sum, p) => sum + Number(p.amount), 0)
}

export function rentalPaidAmount(payments: Array<{ type: PaymentType; amount: unknown }>): number {
  return sumPaymentsByTypes(payments, RENTAL_INCOME_TYPES)
}

export function depositPaidAmount(payments: Array<{ type: PaymentType; amount: unknown }>): number {
  return sumPaymentsByTypes(payments, ['DEPOSIT'])
}

export interface PickupDueAmounts {
  rentalDue: number
  depositDue: number
}

export function computePickupDue(
  paymentPlan: PaymentPlan,
  totalRentalAmount: number,
  depositAmount: number,
  rentalPaid: number,
  depositPaid: number
): PickupDueAmounts {
  const rentalDue = Math.max(0, totalRentalAmount - rentalPaid)
  const depositDue = depositPaid >= depositAmount ? 0 : Math.max(0, depositAmount - depositPaid)
  return { rentalDue, depositDue }
}
