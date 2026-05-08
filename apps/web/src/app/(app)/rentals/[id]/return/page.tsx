'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatDate } from '@/lib/formatters'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Rental } from '@rental/types'

export default function ReturnPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const { data: rental, isLoading } = useQuery<Rental>({
    queryKey: keys.rental(id),
    queryFn: async () => (await api.get(`/rentals/${id}`)).data,
  })

  const mutation = useMutation({
    mutationFn: () => api.post(`/rentals/${id}/return`, { method, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rental(id) })
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      router.push(`/rentals/${id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to process return'),
  })

  if (isLoading) return <LoadingSpinner />
  if (!rental) return <div className="p-6 text-muted">Rental not found</div>
  if (rental.status === 'RETURNED') {
    return (
      <div className="p-6">
        <p className="text-muted text-sm">This rental has already been returned.</p>
        <Link href={`/rentals/${id}`}>
          <Button className="mt-4" variant="outline">Back to Rental</Button>
        </Link>
      </div>
    )
  }

  const inrFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

  return (
    <div>
      <PageHeader
        title="Process Return"
        action={
          <Link href={`/rentals/${id}`}>
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />

      <div className="px-4 md:px-6 max-w-sm space-y-5 pb-8">

        {/* Rental summary */}
        <div className="text-sm space-y-1">
          <p className="item-code">{rental.rentalNumber}</p>
          <p className="font-medium text-ink">{rental.customer.name}</p>
          <p className="text-muted">
            {rental.items.length} item{rental.items.length !== 1 ? 's' : ''} ·
            Rented {formatDate(rental.startDate)}
          </p>
        </div>

        {/* Items */}
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {rental.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-card">
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink font-medium truncate">{item.ornament.name}</p>
                <p className="item-code text-xs">{item.ornament.itemCode}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Deposit refund — the dominant element */}
        <div className="rounded-2xl border-2 border-gold bg-gold/5 p-6 text-center">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Refund to customer
          </p>
          <p className="font-display text-4xl text-gold leading-none">
            {inrFormat.format(rental.depositAmount)}
          </p>
          <p className="text-xs text-muted mt-2">
            Security deposit · collected {formatDate(rental.startDate)}
          </p>
        </div>

        {/* Refund method */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Refund method</Label>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note <span className="text-muted font-normal">(optional)</span></Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Refunded via UPI to customer's number"
              rows={2}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button
          size="lg"
          className="w-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? 'Processing…'
            : `Confirm return · Refund ${inrFormat.format(rental.depositAmount)}`}
        </Button>
      </div>
    </div>
  )
}
