import { startOfDay } from 'date-fns'

export function calculateRentalDays(startDate: Date | string, dueDate: Date | string): number {
  return Math.max(
    1,
    Math.ceil((new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  )
}

export function calculateDaysOverdue(dueDate: Date | string, status: string): number {
  if (status === 'RETURNED' || status === 'BOOKED' || status === 'CANCELLED') return 0
  const today = startOfDay(new Date())
  const due = startOfDay(new Date(dueDate))
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
}
