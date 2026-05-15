import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as AuthRequest).user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
