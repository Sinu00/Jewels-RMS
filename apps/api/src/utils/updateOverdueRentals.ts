import { startOfDay } from 'date-fns'
import { prisma } from '../lib/prisma'

export async function updateOverdueRentals(outletId: string): Promise<void> {
  await prisma.rental.updateMany({
    where: { outletId, status: { in: ['ACTIVE', 'EXTENDED'] }, dueDate: { lt: startOfDay(new Date()) } },
    data: { status: 'OVERDUE' },
  })
}
