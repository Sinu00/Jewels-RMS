import { prisma } from '../lib/prisma'

/** Statuses that block an ornament for a date range (booked or physically out). */
export const BLOCKING_STATUSES = ['BOOKED', 'ACTIVE', 'OVERDUE', 'EXTENDED'] as const

/** Statuses where ornaments are physically with the customer (overdue job runs on these). */
export const ACTIVE_STATUSES = ['ACTIVE', 'OVERDUE', 'EXTENDED'] as const

export type BlockingStatus = (typeof BLOCKING_STATUSES)[number]

export function rentalDateOverlapFilter(startDate: Date, dueDate: Date) {
  return {
    status: { in: [...BLOCKING_STATUSES] },
    startDate: { lte: dueDate },
    dueDate: { gte: startDate },
  }
}

export async function getConflictingOrnamentIds(
  ornamentIds: string[],
  startDate: Date,
  dueDate: Date,
  excludeRentalId?: string
): Promise<string[]> {
  if (!ornamentIds.length) return []

  const conflicts = await prisma.rentalItem.findMany({
    where: {
      ornamentId: { in: ornamentIds },
      rental: {
        ...rentalDateOverlapFilter(startDate, dueDate),
        ...(excludeRentalId ? { id: { not: excludeRentalId } } : {}),
      },
    },
    select: { ornamentId: true },
    distinct: ['ornamentId'],
  })

  return conflicts.map((c) => c.ornamentId)
}

export async function isOrnamentAvailableForRange(
  ornamentId: string,
  startDate: Date,
  dueDate: Date,
  excludeRentalId?: string
): Promise<boolean> {
  const conflicts = await getConflictingOrnamentIds([ornamentId], startDate, dueDate, excludeRentalId)
  return conflicts.length === 0
}

/** Legacy: available right now (not on an active/out rental). */
export async function isOrnamentAvailable(ornamentId: string): Promise<boolean> {
  const activeItem = await prisma.rentalItem.findFirst({
    where: {
      ornamentId,
      rental: { status: { in: [...ACTIVE_STATUSES] } },
    },
    select: { id: true },
  })
  return activeItem === null
}
