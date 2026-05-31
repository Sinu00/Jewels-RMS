import type { PaymentPlan, PaymentType } from '@prisma/client'

export const RENTAL_INCOME_TYPES: PaymentType[] = ['RENTAL', 'RENTAL_ADVANCE', 'RENTAL_BALANCE']

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

export interface BookingPaymentInput {
  paymentPlan: PaymentPlan
  totalRentalAmount: number
  depositAmount: number
  method: string
}

export function bookingPaymentsToCreate(input: BookingPaymentInput): Array<{
  type: PaymentType
  amount: number
}> {
  const { paymentPlan, totalRentalAmount, depositAmount } = input
  const payments: Array<{ type: PaymentType; amount: number }> = []

  switch (paymentPlan) {
    case 'HALF_ADVANCE':
      payments.push({ type: 'RENTAL_ADVANCE', amount: Math.round(totalRentalAmount / 2) })
      break
    case 'FULL_RENT_DEFER_DEPOSIT':
      payments.push({ type: 'RENTAL', amount: totalRentalAmount })
      break
    case 'FULL_UPFRONT':
      payments.push({ type: 'RENTAL', amount: totalRentalAmount })
      if (depositAmount > 0) {
        payments.push({ type: 'DEPOSIT', amount: depositAmount })
      }
      break
  }

  return payments.filter((p) => p.amount > 0)
}

export function pickupPaymentsToCreate(
  paymentPlan: PaymentPlan,
  rentalDue: number,
  depositDue: number
): Array<{ type: PaymentType; amount: number }> {
  const payments: Array<{ type: PaymentType; amount: number }> = []

  if (rentalDue > 0) {
    const type: PaymentType =
      paymentPlan === 'HALF_ADVANCE' ? 'RENTAL_BALANCE' : 'RENTAL'
    payments.push({ type, amount: rentalDue })
  }
  if (depositDue > 0) {
    payments.push({ type: 'DEPOSIT', amount: depositDue })
  }

  return payments
}
