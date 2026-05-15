import { Router, Request, Response } from 'express'
import { startOfDay } from 'date-fns'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { ACTIVE_STATUSES } from '../utils/availability'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const today = startOfDay(new Date())

  // Auto-update overdue
  await prisma.rental.updateMany({
    where: { outletId, status: 'ACTIVE', dueDate: { lt: today } },
    data: { status: 'OVERDUE' },
  })

  const [
    totalActive,
    totalOverdue,
    dueToday,
    todayPayments,
    ornamentStats,
    overdueRentals,
  ] = await Promise.all([
    prisma.rental.count({ where: { outletId, status: { in: ['ACTIVE', 'EXTENDED'] } } }),
    prisma.rental.count({ where: { outletId, status: 'OVERDUE' } }),
    prisma.rental.count({
      where: {
        outletId,
        status: { in: [...ACTIVE_STATUSES] },
        dueDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
    }),
    prisma.payment.aggregate({
      where: { outletId, type: 'RENTAL', createdAt: { gte: today } },
      _sum: { amount: true },
    }),
    Promise.all([
      prisma.ornament.count({ where: { outletId, isDeleted: false } }),
      prisma.ornament.count({
        where: {
          outletId,
          isDeleted: false,
          rentalItems: { none: { rental: { status: { in: [...ACTIVE_STATUSES] } } } },
        },
      }),
    ]),
    prisma.rental.findMany({
      where: { outletId, status: 'OVERDUE' },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: { ornament: { select: { name: true } } },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
  ])

  const todayDue = startOfDay(new Date())
  const overdueList = overdueRentals.map((r) => {
    const due = startOfDay(new Date(r.dueDate))
    const daysOverdue = Math.max(
      0,
      Math.floor((todayDue.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    )
    return {
      rentalId: r.id,
      rentalNumber: r.rentalNumber,
      customerName: r.customer.name,
      customerPhone: r.customer.phone,
      daysOverdue,
      itemNames: r.items.map((i) => i.ornament.name),
      dueDate: r.dueDate,
    }
  })

  res.json({
    totalActiveRentals: totalActive,
    overdueRentals: totalOverdue,
    dueTodayRentals: dueToday,
    todayIncome: Number(todayPayments._sum.amount ?? 0),
    totalOrnaments: ornamentStats[0],
    availableOrnaments: ornamentStats[1],
    overdueList,
  })
})

export default router
