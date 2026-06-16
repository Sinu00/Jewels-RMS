import { startOfDay } from 'date-fns'

export function calculateRentalDays(startDate: Date | string, dueDate: Date | string): number {
  // Inclusive of both the pickup day and the return day: 16th → 17th = 2 days.
  const diffDays = Math.round(
    (new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  return Math.max(1, diffDays + 1)
}

export function calculateDaysOverdue(dueDate: Date | string, status: string): number {
  if (status === 'RETURNED' || status === 'BOOKED' || status === 'CANCELLED') return 0
  const today = startOfDay(new Date())
  const due = startOfDay(new Date(dueDate))
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
}
