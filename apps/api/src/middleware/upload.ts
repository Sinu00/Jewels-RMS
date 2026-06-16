import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request, Response, NextFunction } from 'express'

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

// Browser-displayable formats only — any size. HEIC and other non-web formats
// are rejected so we never store a photo that renders blank.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true)
    cb(new Error('UNSUPPORTED_TYPE'))
  },
})

// Wrap multer so rejections come back as a clean 400 the client can toast,
// instead of bubbling up as a 500.
export function uploadImages(req: Request, res: Response, next: NextFunction) {
  upload.array('images', 5)(req, res, (err: unknown) => {
    if (!err) return next()
    if (err instanceof Error && err.message === 'UNSUPPORTED_TYPE') {
      return res
        .status(400)
        .json({ error: 'That image format is not supported. Please use JPG, PNG, or WebP.' })
    }
    return res.status(400).json({ error: 'Image upload failed. Please try again.' })
  })
}
