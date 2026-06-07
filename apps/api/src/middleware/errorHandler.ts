import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err)

  // Turn common database errors into clean client responses instead of 500s.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'That record already exists' })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' })
    }
    // Bad input the DB rejected (invalid enum value, bad relation, etc.).
    return res.status(400).json({ error: 'Invalid request data' })
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Invalid request data' })
  }

  // Errors we threw on purpose carry a status; surface their message.
  const status = (err as { status?: number })?.status
  if (err instanceof Error && typeof status === 'number') {
    return res.status(status).json({ error: err.message })
  }

  // Anything unexpected: don't leak internals.
  res.status(500).json({ error: 'Internal server error' })
}
