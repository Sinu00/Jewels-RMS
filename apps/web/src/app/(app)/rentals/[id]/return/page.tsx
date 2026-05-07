'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate } from '@/lib/formatters'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Rental } from '@rental/types'
import { useState } from 'react'

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
        <p className="text-muted">This rental has already been returned.</p>
        <Link href={`/rentals/${id}`}><Button className="mt-4">Back to Rental</Button></Link>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Process Return"
        action={<Link href={`/rentals/${id}`}><Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" />Back</Button></Link>}
      />

      <div className="px-4 md:px-6 max-w-lg space-y-5 pb-8">
        {/* Rental info */}
        <div className="bg-card border border-border rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold">{rental.rentalNumber}</p>
          <p className="text-muted">{rental.customer.name}</p>
          <div>
            <p className="text-xs text-muted">Items being returned:</p>
            {rental.items.map((item) => (
              <p key={item.id} className="text-ink">• {item.ornament.name} ({item.ornament.itemCode})</p>
            ))}
          </div>
        </div>

        {/* Deposit refund — prominent */}
        <div className="bg-gold/10 border-2 border-gold rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-muted mb-1">Refund to Customer</p>
          <RupeeAmount amount={rental.depositAmount} size="xl" className="text-gold block" />
          <p className="text-xs text-muted mt-2">Security deposit collected on {formatDate(rental.startDate)}</p>
        </div>

        {/* Payment method */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Refund Method *</Label>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid via UPI to customer" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <Button
          size="lg"
          className="w-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Processing...' : `Confirm Return & Refund ${formatINR(rental.depositAmount)}`}
        </Button>
      </div>
    </div>
  )
}
