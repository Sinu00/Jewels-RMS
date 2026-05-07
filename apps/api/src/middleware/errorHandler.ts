import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error(err)
  if (err instanceof Error) {
    const status = (err as { status?: number }).status ?? 500
    return res.status(status).json({ error: err.message })
  }
  res.status(500).json({ error: 'Internal server error' })
}
