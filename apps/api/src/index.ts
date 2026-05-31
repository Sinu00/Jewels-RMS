import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001')
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

// Ensure upload directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',')
app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)))

// API routes
app.use('/api/v1', routes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
