import jwt from 'jsonwebtoken'

const _secret = process.env.JWT_SECRET
if (!_secret) throw new Error('JWT_SECRET environment variable is required')
const JWT_SECRET: string = _secret
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
