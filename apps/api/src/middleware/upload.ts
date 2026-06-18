import multer from 'multer'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { Request, Response, NextFunction } from 'express'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'
// Longest edge of stored photos. A phone photo (~5MB, 4000px) is shrunk to this
// (~100–300KB), so the grid loads fast and the server never has to process it.
export const MAX_IMAGE_EDGE = 1600

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

// Shrink a saved photo in place: auto-orient from EXIF (so phone photos aren't
// sideways), cap the longest edge, and re-encode. Best-effort — on any sharp
// error the original file is kept so an upload never fails over compression.
export async function compressImageInPlace(filePath: string): Promise<void> {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.gif') return // skip — would drop animation
  try {
    const pipeline = sharp(filePath, { failOn: 'none' })
      .rotate()
      .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true })
    if (ext === '.png') pipeline.png({ compressionLevel: 9 })
    else if (ext === '.webp') pipeline.webp({ quality: 80 })
    else pipeline.jpeg({ quality: 80, mozjpeg: true })
    const buf = await pipeline.toBuffer()
    await fs.promises.writeFile(filePath, buf)
  } catch (e) {
    console.error('[upload] compress failed, keeping original:', filePath, e)
  }
}

// Wrap multer so rejections come back as a clean 400 the client can toast,
// instead of bubbling up as a 500. After a successful upload, each photo is
// compressed before the route handler responds.
export function uploadImages(req: Request, res: Response, next: NextFunction) {
  upload.array('images', 5)(req, res, async (err: unknown) => {
    if (err) {
      if (err instanceof Error && err.message === 'UNSUPPORTED_TYPE') {
        return res
          .status(400)
          .json({ error: 'That image format is not supported. Please use JPG, PNG, or WebP.' })
      }
      return res.status(400).json({ error: 'Image upload failed. Please try again.' })
    }
    const files = (req.files as Express.Multer.File[]) ?? []
    await Promise.all(files.map((f) => compressImageInPlace(f.path)))
    next()
  })
}
