import { Router, Request, Response } from 'express'
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /payments
router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { type, method, from, to, page = '1', limit = '20' } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const where: any = { outletId }
  if (type) where.type = type
  if (method) where.method = method
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }

  const now = new Date()
  const [payments, total, summaryAgg] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        recordedBy: { select: { id: true, name: true } },
        rental: { select: { rentalNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.payment.count({ where }),
    prisma.payment.groupBy({
      by: ['type'],
      where: {
        outletId,
        createdAt: { gte: startOfDay(now) },
      },
      _sum: { amount: true },
    }),
  ])

  const [weekTotal, monthTotal] = await Promise.all([
    prisma.payment.aggregate({
      where: { outletId, createdAt: { gte: startOfWeek(now) } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { outletId, createdAt: { gte: startOfMonth(now) } },
      _sum: { amount: true },
    }),
  ])

  const todayByType: Record<string, number> = {
    RENTAL: 0,
    DEPOSIT: 0,
    DEPOSIT_REFUND: 0,
    OTHER: 0,
  }
  let todayTotal = 0
  for (const row of summaryAgg) {
    const amount = Number(row._sum.amount ?? 0)
    todayByType[row.type] = amount
    todayTotal += amount
  }

  res.json({
    data: payments.map((p) => ({
      id: p.id,
      outletId: p.outletId,
      rentalId: p.rentalId,
      rentalNumber: p.rental?.rentalNumber ?? null,
      type: p.type,
      method: p.method,
      amount: Number(p.amount),
      note: p.note,
      createdAt: p.createdAt,
      recordedBy: { id: p.recordedBy.id, name: p.recordedBy.name },
    })),
    summary: {
      todayTotal,
      weekTotal: Number(weekTotal._sum.amount ?? 0),
      monthTotal: Number(monthTotal._sum.amount ?? 0),
      todayByType,
    },
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// POST /payments
router.post('/', async (req: Request, res: Response) => {
  const { outletId, id: userId } = (req as AuthRequest).user
  const { rentalId, type, method, amount, note } = req.body

  if (!type || !method || !amount) {
    return res.status(400).json({ error: 'type, method, amount required' })
  }

  // Verify rental belongs to outlet if provided
  if (rentalId) {
    const rental = await prisma.rental.findFirst({ where: { id: rentalId, outletId } })
    if (!rental) return res.status(400).json({ error: 'Rental not found' })
  }

  const payment = await prisma.payment.create({
    data: {
      outletId,
      rentalId: rentalId ?? null,
      recordedById: userId,
      type,
      method,
      amount,
      note: note ?? null,
    },
    include: { recordedBy: { select: { id: true, name: true } } },
  })

  res.status(201).json({
    ...payment,
    amount: Number(payment.amount),
  })
})

export default router
