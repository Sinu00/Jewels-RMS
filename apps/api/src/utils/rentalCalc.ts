import { startOfDay } from 'date-fns'

export function calculateRentalDays(startDate: Date | string, dueDate: Date | string): number {
  // Inclusive of both the pickup day and the return day: 16th → 17th = 2 days.
  const diffDays = Math.round(
    (new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  return Math.max(1, diffDays + 1)
}

/**
 * A single line's rent, rounded to whole rupees. Rates can be fractional (e.g. a
 * discount that works out to ₹233.33/day), so each line is rounded on its own and
 * the rounded lines are what add up to the total. Rounding the raw sum instead would
 * leave the total a rupee off from the lines the customer sees (e.g. 3999.75 +
 * 699.75 + 799.50 = 5499.00 → ₹5,499, but the lines read ₹4,000 + ₹700 + ₹800).
 */
export function lineSubtotal(ratePerDay: unknown, days: number): number {
  return Math.round(Number(ratePerDay) * days)
}

/** Rental total = sum of the per-line rounded subtotals. Keep in sync with the web wizard store. */
export function computeRentalTotal(items: Array<{ ratePerDay: unknown }>, days: number): number {
  return items.reduce((sum, item) => sum + lineSubtotal(item.ratePerDay, days), 0)
}

export function calculateDaysOverdue(dueDate: Date | string, status: string): number {
  if (status === 'RETURNED' || status === 'BOOKED' || status === 'CANCELLED') return 0
  const today = startOfDay(new Date())
  const due = startOfDay(new Date(dueDate))
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
}
