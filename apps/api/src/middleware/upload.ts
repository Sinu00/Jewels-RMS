import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const ornamentId = req.params.id
    const dir = path.join(UPLOAD_DIR, 'ornaments', ornamentId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})
