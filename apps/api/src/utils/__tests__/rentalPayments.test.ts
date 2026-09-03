import { describe, it, expect } from 'vitest'
import {
  RENTAL_INCOME_TYPES,
  ACCOUNTS_INCOME_TYPES,
  rentalPaidAmount,
  depositPaidAmount,
  computePickupDue,
} from '../rentalPayments'

/**
 * The ledger is append-only: nothing is ever edited or deleted, so a refund is
 * recorded as a NEGATIVE rent payment rather than by mutating the original row.
 * That choice is only safe if every "how much has this rental been paid" sum
 * includes the refund types — otherwise a cancelled-and-refunded booking still
 * reads as fully paid. These tests pin that invariant.
 */
describe('rentalPaidAmount — refunds net themselves out', () => {
  it('nets a negative RENTAL_REFUND against the advance it reverses', () => {
    const payments = [
      { type: 'RENTAL_ADVANCE' as const, amount: 5000 },
      { type: 'RENTAL_REFUND' as const, amount: -2000 },
    ]
    expect(rentalPaidAmount(payments)).toBe(3000)
  })

  it('returns a fully refunded booking to zero rent paid', () => {
    const payments = [
      { type: 'RENTAL' as const, amount: 5000 },
      { type: 'RENTAL_REFUND' as const, amount: -5000 },
    ]
    expect(rentalPaidAmount(payments)).toBe(0)
  })

  it('ignores deposit movements entirely — a deposit is not rent income', () => {
    const payments = [
      { type: 'RENTAL' as const, amount: 5000 },
      { type: 'DEPOSIT' as const, amount: 10000 },
      { type: 'DEPOSIT_REFUND' as const, amount: 10000 },
    ]
    expect(rentalPaidAmount(payments)).toBe(5000)
    expect(depositPaidAmount(payments)).toBe(10000)
  })

  it('reads Prisma Decimal values, which arrive as strings and not numbers', () => {
    const payments = [{ type: 'RENTAL' as const, amount: '4999.50' }]
    expect(rentalPaidAmount(payments)).toBe(4999.5)
  })
})

describe('income buckets stay separate', () => {
  /**
   * A withheld deposit (damage or late fee) is shop income, but it is NOT rent.
   * If it leaked into the rent bucket, a damaged return would make the rental
   * look overpaid and the balance-due maths would go negative.
   */
  it('counts a withheld deposit as accounts income but never as rent', () => {
    expect(ACCOUNTS_INCOME_TYPES).toContain('DEPOSIT_WITHHELD')
    expect(RENTAL_INCOME_TYPES).not.toContain('DEPOSIT_WITHHELD')
  })

  it('never counts a deposit refund as income in either bucket — it is money going out', () => {
    expect(ACCOUNTS_INCOME_TYPES).not.toContain('DEPOSIT_REFUND')
    expect(RENTAL_INCOME_TYPES).not.toContain('DEPOSIT_REFUND')
  })
})

describe('computePickupDue — what staff must collect before the piece leaves the shop', () => {
  it('asks for the unpaid rent balance and the untouched deposit', () => {
    expect(computePickupDue('HALF_ADVANCE', 10000, 20000, 5000, 0)).toEqual({
      rentalDue: 5000,
      depositDue: 20000,
    })
  })

  it('asks for nothing once rent and deposit are both settled', () => {
    expect(computePickupDue('FULL_UPFRONT', 10000, 20000, 10000, 20000)).toEqual({
      rentalDue: 0,
      depositDue: 0,
    })
  })

  it('never reports a negative due when the customer has overpaid', () => {
    const due = computePickupDue('FULL_UPFRONT', 10000, 20000, 12000, 25000)
    expect(due.rentalDue).toBe(0)
    expect(due.depositDue).toBe(0)
  })
})
