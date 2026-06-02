'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Edit, Trash2, ChevronLeft as Prev, ChevronRight as Next } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate } from '@/lib/formatters'
import { useAuthStore } from '@/stores/authStore'
import { AvailabilityDot } from '@/components/shared/AvailabilityDot'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Ornament } from '@rental/types'

export default function OrnamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAdmin } = useAuthStore()
  const [photoIdx, setPhotoIdx] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: ornament, isLoading } = useQuery<Ornament>({
    queryKey: keys.ornament(id),
    queryFn: async () => (await api.get(`/ornaments/${id}`)).data,
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/ornaments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      router.push('/inventory')
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (!ornament) return <div className="p-6 text-muted">Ornament not found</div>

  const images = ornament.images
  const photo = images[photoIdx]

  return (
    <div>
      <PageHeader
        title={ornament.name}
        back="/inventory"
        action={
          isAdmin() ? (
            <div className="flex gap-2">
              <Link href={`/inventory/${id}/edit`}><Button variant="outline" size="sm"><Edit className="h-4 w-4" />Edit</Button></Link>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="px-4 md:px-6 max-w-2xl mx-auto space-y-5 pb-8">
        {/* Photo gallery */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-bg max-w-sm">
          {photo ? (
            <Image src={photo.url} alt={ornament.name} fill className="object-cover" sizes="384px" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted text-6xl">💍</div>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                disabled={photoIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-30"
              >
                <Prev className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPhotoIdx((i) => Math.min(images.length - 1, i + 1))}
                disabled={photoIdx === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-30"
              >
                <Next className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} className={`h-1.5 w-1.5 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-muted">{ornament.itemCode}</span>
            <AvailabilityDot available={ornament.isAvailable} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-muted text-xs">Category</p>
              <p className="font-medium">{ornament.category}</p>
            </div>
            {ornament.weightGrams && (
              <div>
                <p className="text-muted text-xs">Weight</p>
                <p className="font-medium">{ornament.weightGrams}g</p>
              </div>
            )}
            <div>
              <p className="text-muted text-xs">Rate per Day</p>
              <p className="font-display font-semibold">{formatINR(ornament.baseRatePerDay)}</p>
            </div>
          </div>
          {ornament.description && (
            <p className="text-sm text-muted border-t border-border pt-3">{ornament.description}</p>
          )}
        </div>

        {/* Current rental info */}
        {ornament.currentRental && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">Currently Rented Out</p>
            <p className="text-sm text-amber-700">
              <Link href={`/rentals/${ornament.currentRental.rentalId}`} className="underline">
                {ornament.currentRental.rentalNumber}
              </Link>
              {' '}— {ornament.currentRental.customerName}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Due: {formatDate(ornament.currentRental.dueDate)}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Remove ornament?"
        description="The ornament will be hidden from inventory but rental history is preserved."
        confirmLabel="Remove"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
