import { Router, Request, Response } from 'express'
import { startOfDay } from 'date-fns'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { ACTIVE_STATUSES } from '../utils/availability'
import { todayDateOnlyRange } from '../utils/dateOnly'
import { updateOverdueRentals } from '../utils/updateOverdueRentals'
import { calculateDaysOverdue } from '../utils/rentalCalc'
import { RENTAL_INCOME_TYPES } from '../utils/rentalPayments'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const today = startOfDay(new Date())
  const todayRange = todayDateOnlyRange()

  await updateOverdueRentals(outletId)

  const [
    totalActive,
    totalOverdue,
    totalBooked,
    pickupsToday,
    dueToday,
    todayPayments,
    overdueRentals,
    pickupsTodayList,
  ] = await Promise.all([
    prisma.rental.count({ where: { outletId, status: { in: [...ACTIVE_STATUSES] } } }),
    prisma.rental.count({ where: { outletId, status: 'OVERDUE' } }),
    prisma.rental.count({ where: { outletId, status: 'BOOKED' } }),
    prisma.rental.count({
      where: {
        outletId,
        status: 'BOOKED',
        startDate: todayRange,
      },
    }),
    prisma.rental.count({
      where: {
        outletId,
        status: { in: [...ACTIVE_STATUSES] },
        dueDate: todayRange,
      },
    }),
    prisma.payment.aggregate({
      where: {
        outletId,
        type: { in: RENTAL_INCOME_TYPES },
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    }),
    prisma.rental.findMany({
      where: { outletId, status: 'OVERDUE' },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { ornament: { select: { name: true } } } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    prisma.rental.findMany({
      where: {
        outletId,
        status: 'BOOKED',
        startDate: todayRange,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { include: { ornament: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    }),
  ])

  const overdueList = overdueRentals.map((r) => ({
    rentalId: r.id,
    rentalNumber: r.rentalNumber,
    customerName: r.customer.name,
    customerPhone: r.customer.phone,
    daysOverdue: calculateDaysOverdue(r.dueDate, r.status),
    itemNames: r.items.map((i) => i.ornament.name),
    dueDate: r.dueDate,
  }))

  const pickupsList = pickupsTodayList.map((r) => ({
    rentalId: r.id,
    rentalNumber: r.rentalNumber,
    customerName: r.customer.name,
    customerPhone: r.customer.phone,
    itemNames: r.items.map((i) => i.ornament.name),
    startDate: r.startDate,
  }))

  res.json({
    totalActiveRentals: totalActive,
    overdueRentals: totalOverdue,
    bookedRentals: totalBooked,
    pickupsToday,
    dueTodayRentals: dueToday,
    todayIncome: Number(todayPayments._sum.amount ?? 0),
    overdueList,
    pickupsList,
  })
})

export default router
