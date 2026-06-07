import { Router, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { startOfDay } from 'date-fns'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import { uploadImages } from '../middleware/upload'
import { generateItemCode } from '../utils/itemCode'
import { ACTIVE_STATUSES, BLOCKING_STATUSES, rentalDateOverlapFilter } from '../utils/availability'
import { isPositiveAmount, isNonNegativeAmount } from '../utils/validate'

const router = Router()
router.use(requireAuth)

const BASE_URL = () => process.env.BASE_URL ?? 'http://localhost:3001'
const UPLOAD_DIR = () => process.env.UPLOAD_DIR ?? './uploads'

function imageUrl(filePath: string) {
  return `${BASE_URL()}/uploads/${filePath.replace(/\\/g, '/')}`
}

function mapOrnament(o: any, activeItems: any[]) {
  return {
    id: o.id,
    outletId: o.outletId,
    itemCode: o.itemCode,
    name: o.name,
    category: o.category,
    weightGrams: o.weightGrams ? Number(o.weightGrams) : null,
    baseRatePerDay: Number(o.baseRatePerDay),
    description: o.description,
    isDeleted: o.isDeleted,
    isAvailable: activeItems.length === 0,
    futureBookingsCount: 0,
    images: (o.images ?? [])
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
      .map((img: any) => ({
        id: img.id,
        ornamentId: img.ornamentId,
        url: imageUrl(img.filePath),
        displayOrder: img.displayOrder,
        createdAt: img.createdAt,
      })),
    currentRental: activeItems[0]?.rental
      ? {
          rentalId: activeItems[0].rental.id,
          rentalNumber: activeItems[0].rental.rentalNumber,
          customerName: activeItems[0].rental.customer.name,
          dueDate: activeItems[0].rental.dueDate,
        }
      : undefined,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

// GET /ornaments/categories
router.get('/categories', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const cats = await prisma.ornament.findMany({
    where: { outletId, isDeleted: false },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })
  res.json(cats.map((c) => c.category))
})

// GET /ornaments/export — full dataset for PDF reports (no pagination, no images).
// mode "full" (default): every item with its current availability status.
// mode "available" + startDate/dueDate: only items free across that date range.
router.get('/export', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { available, startDate, dueDate, category, search } =
    req.query as Record<string, string>

  const where: any = { outletId, isDeleted: false }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category) where.category = category

  const availableMode = available === 'true' && !!startDate && !!dueDate
  let rangeStart: Date | null = null
  let rangeEnd: Date | null = null
  if (availableMode) {
    rangeStart = new Date(startDate)
    rangeEnd = new Date(dueDate)
    where.rentalItems = { none: { rental: rentalDateOverlapFilter(rangeStart, rangeEnd) } }
  }

  const ornaments = await prisma.ornament.findMany({
    where,
    include: {
      rentalItems: {
        where: { rental: { status: { in: [...BLOCKING_STATUSES] } } },
        include: {
          rental: { select: { status: true, startDate: true, dueDate: true } },
        },
      },
    },
    orderBy: [{ category: 'asc' }, { itemCode: 'asc' }],
  })

  const data = ornaments.map((o) => {
    const activeItem = o.rentalItems.find((ri) =>
      (ACTIVE_STATUSES as readonly string[]).includes(ri.rental.status)
    )
    const bookedItem = o.rentalItems.find((ri) => ri.rental.status === 'BOOKED')
    let status = 'Available'
    let statusDetail: string | null = null
    if (activeItem) {
      status = activeItem.rental.status === 'OVERDUE' ? 'Overdue' : 'Rented out'
      statusDetail = activeItem.rental.dueDate.toISOString()
    } else if (bookedItem) {
      status = 'Booked'
      statusDetail = bookedItem.rental.startDate.toISOString()
    }
    return {
      itemCode: o.itemCode,
      name: o.name,
      category: o.category,
      weightGrams: o.weightGrams ? Number(o.weightGrams) : null,
      baseRatePerDay: Number(o.baseRatePerDay),
      status,
      statusDetail,
    }
  })

  res.json({
    data,
    total: data.length,
    mode: availableMode ? 'available' : 'full',
    range: availableMode ? { startDate, dueDate } : null,
    generatedAt: new Date().toISOString(),
  })
})

// GET /ornaments
router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { search, category, available, startDate, dueDate, page = '1', limit = '20' } =
    req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const where: any = { outletId, isDeleted: false }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category) where.category = category
  if (available === 'true' && startDate && dueDate) {
    const rangeStart = new Date(startDate)
    const rangeEnd = new Date(dueDate)
    where.rentalItems = {
      none: { rental: rentalDateOverlapFilter(rangeStart, rangeEnd) },
    }
  } else if (available === 'true') {
    where.rentalItems = {
      none: { rental: { status: { in: [...BLOCKING_STATUSES] } } },
    }
  }

  const [ornaments, total] = await Promise.all([
    prisma.ornament.findMany({
      where,
      include: {
        images: true,
        rentalItems: {
          where: { rental: { status: { in: [...BLOCKING_STATUSES] } } },
          include: { rental: { include: { customer: { select: { name: true } } } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.ornament.count({ where }),
  ])

  const today = startOfDay(new Date())
  const ornamentIds = ornaments.map((o) => o.id)
  const futureCounts = ornamentIds.length
    ? await prisma.rentalItem.groupBy({
        by: ['ornamentId'],
        where: {
          ornamentId: { in: ornamentIds },
          rental: { status: 'BOOKED', startDate: { gte: today } },
        },
        _count: { rentalId: true },
      })
    : []

  const futureCountByOrnamentId = new Map<string, number>(
    futureCounts.map((row) => [row.ornamentId, row._count.rentalId])
  )

  res.json({
    data: ornaments.map((o) => {
      const mapped = mapOrnament(o, o.rentalItems)
      return {
        ...mapped,
        futureBookingsCount: futureCountByOrnamentId.get(o.id) ?? 0,
      }
    }),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// POST /ornaments
router.post('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, category, weightGrams, baseRatePerDay, description } = req.body

  if (!name || !category || !baseRatePerDay) {
    return res.status(400).json({ error: 'name, category, baseRatePerDay required' })
  }
  if (!isPositiveAmount(baseRatePerDay)) {
    return res.status(400).json({ error: 'baseRatePerDay must be a number greater than 0' })
  }
  if (weightGrams !== undefined && weightGrams !== null && !isNonNegativeAmount(weightGrams)) {
    return res.status(400).json({ error: 'weightGrams must be 0 or more' })
  }

  const ornament = await prisma.$transaction(async (tx) => {
    const itemCode = await generateItemCode(outletId, category, tx)
    return tx.ornament.create({
      data: {
        outletId,
        itemCode,
        name,
        category,
        weightGrams: weightGrams ?? null,
        baseRatePerDay,
        description: description ?? null,
      },
      include: { images: true, rentalItems: { take: 0 } },
    })
  })

  res.status(201).json(mapOrnament(ornament, []))
})

// GET /ornaments/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const ornament = await prisma.ornament.findFirst({
    where: { id: req.params.id, outletId, isDeleted: false },
    include: {
      images: true,
      rentalItems: {
        where: { rental: { status: { in: [...BLOCKING_STATUSES] } } },
        include: { rental: { include: { customer: { select: { name: true } } } } },
        take: 1,
      },
    },
  })
  if (!ornament) return res.status(404).json({ error: 'Not found' })
  res.json(mapOrnament(ornament, ornament.rentalItems))
})

// PATCH /ornaments/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, weightGrams, baseRatePerDay, description } = req.body

  const existing = await prisma.ornament.findFirst({
    where: { id: req.params.id, outletId, isDeleted: false },
  })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const updated = await prisma.ornament.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(weightGrams !== undefined && { weightGrams }),
      ...(baseRatePerDay !== undefined && { baseRatePerDay }),
...(description !== undefined && { description }),
    },
    include: {
      images: true,
      rentalItems: {
        where: { rental: { status: { in: [...BLOCKING_STATUSES] } } },
        include: { rental: { include: { customer: { select: { name: true } } } } },
        take: 1,
      },
    },
  })
  res.json(mapOrnament(updated, updated.rentalItems))
})

// DELETE /ornaments/:id (soft delete, admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const existing = await prisma.ornament.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  await prisma.$transaction(async (tx) => {
    // The item is hidden from all listings, so its photos are dead weight — drop them.
    await tx.ornamentImage.deleteMany({ where: { ornamentId: req.params.id } })
    await tx.ornament.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    })
  })
  // Remove the photo files from disk too (best-effort).
  fs.rmSync(path.join(UPLOAD_DIR(), 'ornaments', req.params.id), { recursive: true, force: true })

  res.json({ success: true })
})

// POST /ornaments/:id/images
router.post('/:id/images', uploadImages.array('images', 5), async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const ornament = await prisma.ornament.findFirst({
    where: { id: req.params.id, outletId, isDeleted: false },
    include: { images: true },
  })
  if (!ornament) return res.status(404).json({ error: 'Not found' })
  if (ornament.images.length >= 5) {
    return res.status(400).json({ error: 'Maximum 5 images allowed' })
  }

  const files = req.files as Express.Multer.File[]
  if (!files?.length) return res.status(400).json({ error: 'No files uploaded' })

  const remaining = 5 - ornament.images.length
  const toSave = files.slice(0, remaining)

  const images = await Promise.all(
    toSave.map((file, i) => {
      const filePath = path
        .relative(UPLOAD_DIR(), file.path)
        .replace(/\\/g, '/')
      return prisma.ornamentImage.create({
        data: {
          ornamentId: req.params.id,
          filePath,
          displayOrder: ornament.images.length + i,
        },
      })
    })
  )

  res.status(201).json(
    images.map((img) => ({
      id: img.id,
      ornamentId: img.ornamentId,
      url: imageUrl(img.filePath),
      displayOrder: img.displayOrder,
      createdAt: img.createdAt,
    }))
  )
})

// DELETE /ornaments/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const ornament = await prisma.ornament.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!ornament) return res.status(404).json({ error: 'Not found' })

  const image = await prisma.ornamentImage.findFirst({
    where: { id: req.params.imageId, ornamentId: req.params.id },
  })
  if (!image) return res.status(404).json({ error: 'Image not found' })

  const fullPath = path.join(UPLOAD_DIR(), image.filePath)
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)

  await prisma.ornamentImage.delete({ where: { id: req.params.imageId } })
  res.json({ success: true })
})

export default router
