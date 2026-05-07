import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import { ACTIVE_STATUSES } from '../utils/availability'

const router = Router()
router.use(requireAuth)

// GET /customers
router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { search, page = '1', limit = '20' } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const where: any = { outletId, isDeleted: false }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            rentals: { where: { status: { in: [...ACTIVE_STATUSES] } } },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limitNum,
    }),
    prisma.customer.count({ where }),
  ])

  res.json({
    data: customers.map((c) => ({
      id: c.id,
      outletId: c.outletId,
      name: c.name,
      phone: c.phone,
      address: c.address,
      idProofType: c.idProofType,
      idProofNumber: c.idProofNumber,
      isDeleted: c.isDeleted,
      activeRentalsCount: c._count.rentals,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// POST /customers
router.post('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, phone, address, idProofType, idProofNumber } = req.body

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone required' })
  }

  const customer = await prisma.customer.create({
    data: { outletId, name, phone, address, idProofType, idProofNumber },
  })
  res.status(201).json({ ...customer, activeRentalsCount: 0 })
})

// GET /customers/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, outletId, isDeleted: false },
    include: {
      _count: {
        select: {
          rentals: { where: { status: { in: [...ACTIVE_STATUSES] } } },
        },
      },
    },
  })
  if (!customer) return res.status(404).json({ error: 'Not found' })
  res.json({ ...customer, activeRentalsCount: customer._count.rentals })
})

// PATCH /customers/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, phone, address, idProofType, idProofNumber } = req.body

  const existing = await prisma.customer.findFirst({
    where: { id: req.params.id, outletId, isDeleted: false },
  })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const updated = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(idProofType !== undefined && { idProofType }),
      ...(idProofNumber !== undefined && { idProofNumber }),
    },
  })
  res.json(updated)
})

// DELETE /customers/:id (soft delete, admin only)
router.delete('/:id', requireAdmin as any, async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const existing = await prisma.customer.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  await prisma.customer.update({ where: { id: req.params.id }, data: { isDeleted: true } })
  res.json({ success: true })
})

// GET /customers/:id/rentals
router.get('/:id/rentals', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { page = '1', limit = '10' } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!customer) return res.status(404).json({ error: 'Not found' })

  const where = { customerId: req.params.id, outletId }
  const [rentals, total] = await Promise.all([
    prisma.rental.findMany({
      where,
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.rental.count({ where }),
  ])

  res.json({
    data: rentals.map((r) => ({
      id: r.id,
      rentalNumber: r.rentalNumber,
      status: r.status,
      startDate: r.startDate,
      dueDate: r.dueDate,
      returnedAt: r.returnedAt,
      depositAmount: Number(r.depositAmount),
      itemsCount: r._count.items,
      createdAt: r.createdAt,
    })),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

export default router
