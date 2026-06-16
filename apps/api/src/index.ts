import 'dotenv/config'
// Run on the shop's clock so "today", overdue, and daily counts use IST day
// boundaries instead of the server's UTC. Must be set before any Date is used.
process.env.TZ = process.env.TZ ?? 'Asia/Kolkata'
import 'express-async-errors' // route async errors reach errorHandler (no crash)
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'path'
import fs from 'fs'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

// Last-resort safety nets: log instead of letting a stray rejection kill the API.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001')
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

// Ensure upload directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// Behind a reverse proxy (Caddy) — trust X-Forwarded-* so rate limiting and
// protocol detection use the real client IP, not the proxy's.
app.set('trust proxy', 1)

// Security headers. crossOriginResourcePolicy is relaxed so the Next image
// optimizer can fetch /uploads images cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(compression())

// Sanity check: catch the "production is still running dev config" class of bug
// (a stale or wrong .env). Warn loudly instead of silently allowing localhost.
if (process.env.NODE_ENV === 'production') {
  const corsOrigin = process.env.CORS_ORIGIN ?? ''
  if (!corsOrigin || corsOrigin.includes('localhost')) {
    console.warn(
      `[config] NODE_ENV=production but CORS_ORIGIN is "${corsOrigin || '(unset)'}" — ` +
        'set it to the live domain in apps/api/.env, or the browser will be blocked.'
    )
  }
}

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',')
app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Liveness/health probe for uptime monitoring and the reverse proxy
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)))

// API routes
app.use('/api/v1', routes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
