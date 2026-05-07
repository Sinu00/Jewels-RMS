import { prisma } from '../lib/prisma'

const ACTIVE_STATUSES = ['ACTIVE', 'OVERDUE', 'EXTENDED'] as const

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

export { ACTIVE_STATUSES }
