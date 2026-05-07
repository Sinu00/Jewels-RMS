import { Router, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import { uploadImages } from '../middleware/upload'
import { generateItemCode } from '../utils/itemCode'
import { ACTIVE_STATUSES } from '../utils/availability'

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
    valuationPrice: Number(o.valuationPrice),
    description: o.description,
    isDeleted: o.isDeleted,
    isAvailable: activeItems.length === 0,
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

// GET /ornaments
router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { search, category, available, page = '1', limit = '20' } = req.query as Record<string, string>

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
  if (available === 'true') {
    where.rentalItems = {
      none: { rental: { status: { in: [...ACTIVE_STATUSES] } } },
    }
  }

  const [ornaments, total] = await Promise.all([
    prisma.ornament.findMany({
      where,
      include: {
        images: true,
        rentalItems: {
          where: { rental: { status: { in: [...ACTIVE_STATUSES] } } },
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

  res.json({
    data: ornaments.map((o) => mapOrnament(o, o.rentalItems)),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// POST /ornaments
router.post('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, category, weightGrams, baseRatePerDay, valuationPrice, description } = req.body

  if (!name || !category || !baseRatePerDay || !valuationPrice) {
    return res.status(400).json({ error: 'name, category, baseRatePerDay, valuationPrice required' })
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
        valuationPrice,
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
        where: { rental: { status: { in: [...ACTIVE_STATUSES] } } },
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
  const { name, weightGrams, baseRatePerDay, valuationPrice, description } = req.body

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
      ...(valuationPrice !== undefined && { valuationPrice }),
      ...(description !== undefined && { description }),
    },
    include: {
      images: true,
      rentalItems: {
        where: { rental: { status: { in: [...ACTIVE_STATUSES] } } },
        include: { rental: { include: { customer: { select: { name: true } } } } },
        take: 1,
      },
    },
  })
  res.json(mapOrnament(updated, updated.rentalItems))
})

// DELETE /ornaments/:id (soft delete, admin only)
router.delete('/:id', requireAdmin as any, async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const existing = await prisma.ornament.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  await prisma.ornament.update({
    where: { id: req.params.id },
    data: { isDeleted: true },
  })
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
