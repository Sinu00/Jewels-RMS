import { describe, it, expect } from 'vitest'
import { calculateRentalDays, lineSubtotal, computeRentalTotal, calculateDaysOverdue } from '../rentalCalc'

/**
 * Rent is charged per day, so how a "day" is counted and where rupees are
 * rounded are the two decisions the customer actually sees on the bill.
 * These tests pin both, because getting either wrong is a money bug.
 */
describe('calculateRentalDays — both the pickup day and the return day are charged', () => {
  it('charges 2 days for a same-week 16th → 17th booking', () => {
    expect(calculateRentalDays('2026-06-16', '2026-06-17')).toBe(2)
  })

  it('charges 1 day when the piece goes out and comes back the same day', () => {
    expect(calculateRentalDays('2026-06-16', '2026-06-16')).toBe(1)
  })

  it('never charges less than a day, even if the dates are inverted', () => {
    expect(calculateRentalDays('2026-06-17', '2026-06-16')).toBe(1)
  })

  it('is unaffected by the DST-style hour shifts a naive divide-by-86400000 would round badly', () => {
    // 30 days apart; a floor() on a 23- or 25-hour day would return 30 instead of 31.
    expect(calculateRentalDays('2026-03-01', '2026-03-31')).toBe(31)
  })
})

describe('lineSubtotal / computeRentalTotal — round each line, then add', () => {
  /**
   * The regression this guards: rounding the raw sum instead of each line leaves
   * the printed total a rupee off from the lines the customer is reading.
   * 3999.75 + 699.75 + 799.50 sums to exactly 5499.00, but the displayed lines
   * are 4000 + 700 + 800 = 5500. The lines are what the customer adds up, so
   * the lines win.
   */
  it('matches the sum of the rounded lines, not the rounded sum', () => {
    const days = 3
    const items = [{ ratePerDay: 1333.25 }, { ratePerDay: 233.25 }, { ratePerDay: 266.5 }]

    expect(items.map((i) => lineSubtotal(i.ratePerDay, days))).toEqual([4000, 700, 800])
    expect(computeRentalTotal(items, days)).toBe(5500)

    const roundedSum = Math.round(items.reduce((s, i) => s + i.ratePerDay * days, 0))
    expect(roundedSum).toBe(5499)
    expect(computeRentalTotal(items, days)).not.toBe(roundedSum)
  })

  it('gives a zero total for an empty cart rather than NaN', () => {
    expect(computeRentalTotal([], 5)).toBe(0)
  })
})

describe('calculateDaysOverdue — only counts against pieces that are actually out', () => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  it('counts whole days past the due date for a rental still with the customer', () => {
    expect(calculateDaysOverdue(twoDaysAgo, 'ACTIVE')).toBe(2)
  })

  it.each(['RETURNED', 'BOOKED', 'CANCELLED'])(
    'reports 0 for %s — the shop is not owed a late fee',
    (status) => {
      expect(calculateDaysOverdue(twoDaysAgo, status)).toBe(0)
    }
  )
})
