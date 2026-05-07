import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const EXPIRES_IN = '7d'

export interface JwtPayload {
  userId: string
  outletId: string
  role: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}
