import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'

const router = Router()
router.use(requireAuth)
router.use(requireAdmin)

// ─── Current outlet shortcuts ───────────────────────────────────────────────

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

// GET /settings/staff  (current outlet only)
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
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' })
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
  const existing = await prisma.user.findFirst({ where: { id: req.params.id, outletId } })
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

// ─── Categories ─────────────────────────────────────────────────────────────

// GET /settings/categories
router.get('/categories', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId }, select: { categoriesJson: true } })
  if (!outlet) return res.status(404).json({ error: 'Outlet not found' })
  try { res.json(JSON.parse(outlet.categoriesJson)) } catch { res.json([]) }
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

// ─── Outlet Master (all outlets, cross-outlet admin) ────────────────────────

// GET /settings/outlets
router.get('/outlets', async (_req: Request, res: Response) => {
  const outlets = await prisma.outlet.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { users: true } },
    },
  })
  res.json(outlets.map((o) => ({
    id: o.id,
    name: o.name,
    address: o.address,
    phone: o.phone,
    userCount: o._count.users,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  })))
})

// POST /settings/outlets
router.post('/outlets', async (req: Request, res: Response) => {
  const { name, address, phone } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const outlet = await prisma.outlet.create({
    data: { name, address: address ?? null, phone: phone ?? null },
  })
  res.status(201).json(outlet)
})

// PATCH /settings/outlets/:id
router.patch('/outlets/:id', async (req: Request, res: Response) => {
  const { name, address, phone } = req.body
  const existing = await prisma.outlet.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Outlet not found' })
  const updated = await prisma.outlet.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
    },
  })
  res.json(updated)
})

// DELETE /settings/outlets/:id
router.delete('/outlets/:id', async (req: Request, res: Response) => {
  const existing = await prisma.outlet.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Outlet not found' })
  const activeRentals = await prisma.rental.count({
    where: { outletId: req.params.id, status: { not: 'RETURNED' } },
  })
  if (activeRentals > 0) {
    return res.status(400).json({ error: 'Cannot delete outlet with active rentals' })
  }
  await prisma.outlet.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// GET /settings/outlets/:id/staff
router.get('/outlets/:id/staff', async (req: Request, res: Response) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: req.params.id } })
  if (!outlet) return res.status(404).json({ error: 'Outlet not found' })
  const staff = await prisma.user.findMany({
    where: { outletId: req.params.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(staff)
})

// POST /settings/outlets/:id/staff
router.post('/outlets/:id/staff', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' })
  const outlet = await prisma.outlet.findUnique({ where: { id: req.params.id } })
  if (!outlet) return res.status(404).json({ error: 'Outlet not found' })
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'Email already in use' })
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { outletId: req.params.id, name, email, passwordHash, role: role ?? 'STAFF' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  res.status(201).json(user)
})

// PATCH /settings/outlets/:id/staff/:userId
router.patch('/outlets/:id/staff/:userId', async (req: Request, res: Response) => {
  const { name, role, isActive } = req.body
  const existing = await prisma.user.findFirst({ where: { id: req.params.userId, outletId: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'User not found' })
  const updated = await prisma.user.update({
    where: { id: req.params.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  res.json(updated)
})

// DELETE /settings/outlets/:id/staff/:userId
router.delete('/outlets/:id/staff/:userId', async (req: Request, res: Response) => {
  const existing = await prisma.user.findFirst({ where: { id: req.params.userId, outletId: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'User not found' })
  await prisma.user.delete({ where: { id: req.params.userId } })
  res.json({ success: true })
})

// ─── Danger Zone: clear transactional data ──────────────────────────────────

// POST /settings/clear-data
// Wipes all rentals, rental items/extensions, payments and customers for the
// CURRENT outlet, while keeping ornaments (inventory), staff accounts and the
// outlet itself. Once rentals are gone, every ornament reads as available again
// (availability is derived from rentals). Irreversible — gated by a shared
// password (env CLEAR_DATA_PASSWORD, default "rmsclear").
router.post('/clear-data', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { password } = req.body as { password?: string }

  const expected = process.env.CLEAR_DATA_PASSWORD ?? 'rmsclear'
  if (password !== expected) {
    return res.status(403).json({ error: 'Incorrect password.' })
  }

  // Delete children before parents — the schema defines no cascade deletes.
  const deleted = await prisma.$transaction(async (tx) => {
    const payments = await tx.payment.deleteMany({ where: { outletId } })
    const extensions = await tx.rentalExtension.deleteMany({ where: { rental: { outletId } } })
    const items = await tx.rentalItem.deleteMany({ where: { rental: { outletId } } })
    const rentals = await tx.rental.deleteMany({ where: { outletId } })
    const customers = await tx.customer.deleteMany({ where: { outletId } })
    return {
      payments: payments.count,
      rentalExtensions: extensions.count,
      rentalItems: items.count,
      rentals: rentals.count,
      customers: customers.count,
    }
  })

  res.json({ success: true, deleted })
})

export default router
