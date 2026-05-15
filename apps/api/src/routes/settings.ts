import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'

const router = Router()
router.use(requireAuth)
router.use(requireAdmin as any)

// GET /settings/outlet
router.get('/outlet', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } })
  if (!outlet) return res.status(404).json({ error: 'Outlet not found' })
  res.json(outlet)
})

// PATCH /settings/outlet
router.patch('/outlet', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, address, phone } = req.body
  const updated = await prisma.outlet.update({
    where: { id: outletId },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
    },
  })
  res.json(updated)
})

// GET /settings/staff
router.get('/staff', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const staff = await prisma.user.findMany({
    where: { outletId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(staff)
})

// POST /settings/staff
router.post('/staff', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password required' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'Email already in use' })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { outletId, name, email, passwordHash, role: role ?? 'STAFF' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  res.status(201).json(user)
})

// PATCH /settings/staff/:id
router.patch('/staff/:id', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { name, role, isActive } = req.body

  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, outletId },
  })
  if (!existing) return res.status(404).json({ error: 'Staff not found' })

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  res.json(updated)
})

// PATCH /settings/staff/:id/password
router.patch('/staff/:id/password', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { newPassword } = req.body

  if (!newPassword) return res.status(400).json({ error: 'newPassword required' })

  const existing = await prisma.user.findFirst({ where: { id: req.params.id, outletId } })
  if (!existing) return res.status(404).json({ error: 'Staff not found' })

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } })
  res.json({ success: true })
})

// GET /settings/categories
router.get('/categories', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId }, select: { categoriesJson: true } })
  if (!outlet) return res.status(404).json({ error: 'Outlet not found' })
  try {
    res.json(JSON.parse(outlet.categoriesJson))
  } catch {
    res.json([])
  }
})

// PATCH /settings/categories
router.patch('/categories', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { categories } = req.body
  if (!Array.isArray(categories)) return res.status(400).json({ error: 'categories must be an array' })
  const cleaned = categories.filter((c: any) => typeof c === 'string' && c.trim()).map((c: string) => c.trim())
  await prisma.outlet.update({ where: { id: outletId }, data: { categoriesJson: JSON.stringify(cleaned) } })
  res.json(cleaned)
})

export default router
