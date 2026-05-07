'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { OrnamentImage } from '@rental/types'

interface ImageUploaderProps {
  ornamentId: string
  images: OrnamentImage[]
  onImagesChange: (images: OrnamentImage[]) => void
  maxImages?: number
}

export function ImageUploader({ ornamentId, images, onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList) {
    if (!files.length || images.length >= maxImages) return
    setUploading(true)
    try {
      const formData = new FormData()
      const toUpload = Array.from(files).slice(0, maxImages - images.length)
      toUpload.forEach((f) => formData.append('images', f))
      const { data } = await api.post(`/ornaments/${ornamentId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onImagesChange([...images, ...data])
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
              'h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:border-gold hover:text-gold transition-colors',
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
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <p className="mt-1.5 text-xs text-muted">Up to {maxImages} photos, max 5MB each</p>
    </div>
  )
}
