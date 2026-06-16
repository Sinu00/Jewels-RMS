'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { OrnamentImage } from '@rental/types'

interface ImageUploaderProps {
  ornamentId: string
  images: OrnamentImage[]
  onImagesChange: (images: OrnamentImage[]) => void
  maxImages?: number
}

// HEIC/HEIF (the iPhone default) can't be displayed by browsers, so we reject
// it up front instead of storing a photo that shows up blank.
function isHeic(file: File) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

export function ImageUploader({ ornamentId, images, onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList) {
    if (!files.length) return
    if (images.length >= maxImages) {
      toast.error(`You can add up to ${maxImages} photos.`)
      return
    }
    const picked = Array.from(files).slice(0, maxImages - images.length)
    const usable = picked.filter((f) => !isHeic(f))
    if (usable.length < picked.length) {
      toast.error('HEIC images are not supported. Please use JPG, PNG, or WebP.')
    }
    if (!usable.length) return

    setUploading(true)
    try {
      const formData = new FormData()
      usable.forEach((f) => formData.append('images', f))
      // Let axios set `multipart/form-data; boundary=…` itself — passing the
      // header manually drops the boundary and breaks the upload.
      const { data } = await api.post(`/ornaments/${ornamentId}/images`, formData)
      onImagesChange([...images, ...data])
      toast.success(data.length > 1 ? `${data.length} photos added` : 'Photo added')
    } catch (err: any) {
      // Surface the reason as a toast instead of letting the rejection bubble
      // up as an unhandled runtime error.
      toast.error(err.response?.data?.error ?? 'Could not upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function removeImage(imageId: string) {
    await api.delete(`/ornaments/${ornamentId}/images/${imageId}`)
    onImagesChange(images.filter((i) => i.id !== imageId))
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {images.map((img) => (
          <div key={img.id} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border group">
            <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
            <button
              type="button"
              onClick={() => removeImage(img.id)}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:border-ink hover:text-ink transition-colors',
              uploading && 'opacity-50'
            )}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">{uploading ? '...' : 'Add'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          // Reset so picking the same file again re-triggers onChange.
          e.target.value = ''
        }}
      />
      <p className="mt-1.5 text-xs text-muted">Up to {maxImages} photos</p>
    </div>
  )
}
