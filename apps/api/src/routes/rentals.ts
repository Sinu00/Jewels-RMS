import { Router, Request, Response } from 'express'
import { startOfDay } from 'date-fns'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { generateRentalNumber } from '../utils/rentalNumber'
import { ACTIVE_STATUSES } from '../utils/availability'

const router = Router()
router.use(requireAuth)

async function updateOverdueRentals(outletId: string) {
  await prisma.rental.updateMany({
    where: {
      outletId,
      status: 'ACTIVE',
      dueDate: { lt: startOfDay(new Date()) },
    },
    data: { status: 'OVERDUE' },
  })
}

function mapRentalSummary(r: any): object {
  const totalRentalAmount = r.items.reduce((sum: number, item: any) => {
    const days = Math.max(
      1,
      Math.ceil(
        (new Date(r.dueDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    )
    return sum + Number(item.ratePerDay) * days
  }, 0)

  const today = startOfDay(new Date())
  const due = startOfDay(new Date(r.dueDate))
  const daysOverdue =
    r.status !== 'RETURNED' ? Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))) : 0

  return {
    id: r.id,
    rentalNumber: r.rentalNumber,
    customerId: r.customerId,
    customerName: r.customer.name,
    status: r.status,
    startDate: r.startDate,
    dueDate: r.dueDate,
    itemsCount: r.items.length,
    depositAmount: Number(r.depositAmount),
    totalRentalAmount,
    daysOverdue,
    createdAt: r.createdAt,
  }
}

function mapRentalDetail(r: any): object {
  const today = startOfDay(new Date())
  const due = startOfDay(new Date(r.dueDate))
  const daysOverdue =
    r.status !== 'RETURNED' ? Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))) : 0

  const days = Math.max(
    1,
    Math.ceil((new Date(r.dueDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24))
  )

  const items = r.items.map((item: any) => ({
    id: item.id,
    ornamentId: item.ornamentId,
    ornament: {
      id: item.ornament.id,
      itemCode: item.ornament.itemCode,
      name: item.ornament.name,
      category: item.ornament.category,
      images: item.ornament.images.map((img: any) => ({
        id: img.id,
        url: `${process.env.BASE_URL ?? 'http://localhost:3001'}/uploads/${img.filePath}`,
        displayOrder: img.displayOrder,
      })),
    },
    ratePerDay: Number(item.ratePerDay),
    totalAmount: Number(item.ratePerDay) * days,
  }))

  const totalRentalAmount = items.reduce((s: number, i: any) => s + i.totalAmount, 0)

  return {
    id: r.id,
    rentalNumber: r.rentalNumber,
    outletId: r.outletId,
    customerId: r.customerId,
    customer: { id: r.customer.id, name: r.customer.name, phone: r.customer.phone },
    status: r.status,
    startDate: r.startDate,
    dueDate: r.dueDate,
    returnedAt: r.returnedAt,
    depositAmount: Number(r.depositAmount),
    depositRefunded: r.depositRefunded,
    notes: r.notes,
    items,
    totalRentalAmount,
    extensions: r.extensions.map((e: any) => ({
      id: e.id,
      rentalId: e.rentalId,
      previousDueDate: e.previousDueDate,
      newDueDate: e.newDueDate,
      reason: e.reason,
      createdAt: e.createdAt,
    })),
    payments: r.payments.map((p: any) => ({
      id: p.id,
      outletId: p.outletId,
      rentalId: p.rentalId,
      type: p.type,
      method: p.method,
      amount: Number(p.amount),
      note: p.note,
      createdAt: p.createdAt,
      recordedBy: { id: p.recordedBy.id, name: p.recordedBy.name },
    })),
    daysOverdue,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

const rentalDetailInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  items: {
    include: {
      ornament: {
        include: { images: { orderBy: { displayOrder: 'asc' as const } } },
      },
    },
  },
  extensions: { orderBy: { createdAt: 'asc' as const } },
  payments: {
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
}

// GET /rentals
router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { status, search, dueDate, page = '1', limit = '20' } = req.query as Record<string, string>

  await updateOverdueRentals(outletId)

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const where: any = { outletId }
  if (status) where.status = status
  if (dueDate) {
    const d = new Date(dueDate)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    where.dueDate = { gte: d, lt: next }
  }
  if (search) {
    where.OR = [
      { rentalNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [rentals, total] = await Promise.all([
    prisma.rental.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        items: { select: { ratePerDay: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.rental.count({ where }),
  ])

  res.json({
    data: rentals.map(mapRentalSummary),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// POST /rentals
router.post('/', async (req: Request, res: Response) => {
  const { outletId, id: userId } = (req as AuthRequest).user
  const { customerId, startDate, dueDate, depositAmount, depositMethod, notes, items } = req.body

  if (!customerId || !startDate || !dueDate || !depositAmount || !depositMethod || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Verify customer belongs to outlet
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, outletId, isDeleted: false },
  })
  if (!customer) return res.status(400).json({ error: 'Customer not found' })

  // Verify all ornaments are available
  const ornamentIds: string[] = items.map((i: any) => i.ornamentId)
  const activeConflicts = await prisma.rentalItem.findMany({
    where: {
      ornamentId: { in: ornamentIds },
      rental: { status: { in: [...ACTIVE_STATUSES] } },
    },
    select: { ornamentId: true },
  })
  if (activeConflicts.length > 0) {
    return res.status(400).json({ error: 'One or more ornaments are currently rented out', conflicts: activeConflicts.map((c) => c.ornamentId) })
  }

  const rental = await prisma.$transaction(async (tx) => {
    const rentalNumber = await generateRentalNumber(outletId, tx)
    const newRental = await tx.rental.create({
      data: {
        outletId,
        customerId,
        rentalNumber,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        depositAmount,
        notes: notes ?? null,
        items: {
          create: items.map((item: any) => ({
            ornamentId: item.ornamentId,
            ratePerDay: item.ratePerDay,
          })),
        },
      },
      include: {
        ...rentalDetailInclude,
      },
    })

    // Record deposit payment
    await tx.payment.create({
      data: {
        outletId,
        rentalId: newRental.id,
        recordedById: userId,
        type: 'DEPOSIT',
        method: depositMethod,
        amount: depositAmount,
      },
    })

    return newRental
  })

  // Fetch full rental with payments
  const fullRental = await prisma.rental.findUnique({
    where: { id: rental.id },
    include: rentalDetailInclude,
  })

  res.status(201).json(mapRentalDetail(fullRental))
})

// GET /rentals/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const rental = await prisma.rental.findFirst({
    where: { id: req.params.id, outletId },
    include: rentalDetailInclude,
  })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  res.json(mapRentalDetail(rental))
})

// POST /rentals/:id/return
router.post('/:id/return', async (req: Request, res: Response) => {
  const { outletId, id: userId } = (req as AuthRequest).user
  const { method, note } = req.body

  if (!method) return res.status(400).json({ error: 'method required' })

  const rental = await prisma.rental.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.status === 'RETURNED') {
    return res.status(400).json({ error: 'Rental already returned' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.rental.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED', returnedAt: new Date(), depositRefunded: true },
    })
    // Deposit refund — amount taken from stored depositAmount, no recalculation
    await tx.payment.create({
      data: {
        outletId,
        rentalId: req.params.id,
        recordedById: userId,
        type: 'DEPOSIT_REFUND',
        method,
        amount: rental.depositAmount,
        note: note ?? null,
      },
    })
  })

  const updated = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalDetailInclude,
  })
  res.json(mapRentalDetail(updated))
})

// POST /rentals/:id/extend
router.post('/:id/extend', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { newDueDate, reason } = req.body

  if (!newDueDate) return res.status(400).json({ error: 'newDueDate required' })

  const rental = await prisma.rental.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.status === 'RETURNED') {
    return res.status(400).json({ error: 'Cannot extend a returned rental' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.rentalExtension.create({
      data: {
        rentalId: req.params.id,
        previousDueDate: rental.dueDate,
        newDueDate: new Date(newDueDate),
        reason: reason ?? null,
      },
    })
    await tx.rental.update({
      where: { id: req.params.id },
      data: { dueDate: new Date(newDueDate), status: 'EXTENDED' },
    })
  })

  const updated = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalDetailInclude,
  })
  res.json(mapRentalDetail(updated))
})

export default router
