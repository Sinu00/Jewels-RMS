import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { outlet: { select: { id: true, name: true } } },
  })

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken({ userId: user.id, outletId: user.outletId, role: user.role })

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      outletId: user.outletId,
      outletName: user.outlet.name,
    },
  })
})

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { id, outletId } = (req as AuthRequest).user
  const user = await prisma.user.findUnique({
    where: { id },
    include: { outlet: { select: { id: true, name: true } } },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    outletId,
    outletName: user.outlet.name,
  })
})

export default router
