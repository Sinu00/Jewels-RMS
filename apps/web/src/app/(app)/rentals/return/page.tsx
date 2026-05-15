'use client'

import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, ArrowLeft, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatDate } from '@/lib/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RupeeAmount } from '@/components/shared/RupeeAmount'

export default function GenericReturnPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [selectedRental, setSelectedRental] = useState<any>(null)
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: keys.rentals({ search: debouncedSearch, excludeReturned: true }),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await api.get(`/rentals?${params}`)
      return (res.data.data as any[]).filter((r: any) => r.status !== 'RETURNED')
    },
    enabled: debouncedSearch.length >= 1,
  })

  const returnMutation = useMutation({
    mutationFn: async ({ id, method, note }: { id: string; method: string; note: string }) =>
      (await api.post(`/rentals/${id}/return`, { method, note: note || undefined })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.rental(data.id) })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      router.push(`/rentals/${data.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to process return'),
  })

  function handleConfirm() {
    if (!selectedRental) return
    setError('')
    returnMutation.mutate({ id: selectedRental.id, method, note })
  }

  return (
    <div>
      <PageHeader title="Process Return" back="/dashboard" />

      <div className="px-5 md:px-6 max-w-lg pb-8">
        {!selectedRental ? (
          <>
            <p className="text-sm text-muted mb-4">Search by customer name or rental number to find an active rental.</p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search rentals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {search.length === 0 && (
              <p className="text-sm text-muted text-center py-6">Start typing to search for a rental</p>
            )}

            {searching && <LoadingSpinner />}

            {searchResults && searchResults.length === 0 && search.length > 0 && !searching && (
              <p className="text-sm text-muted text-center py-6">No active rentals found</p>
            )}

            <div className="space-y-2">
              {searchResults?.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRental(r)}
                  className="w-full text-left bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-ink hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="item-code font-mono text-xs">{r.rentalNumber}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="font-medium text-ink">{r.customerName}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Due {formatDate(r.dueDate)} · {r.itemsCount} item{r.itemsCount !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { setSelectedRental(null); setError('') }}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </button>

            {/* Selected rental summary */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="item-code font-mono text-xs">{selectedRental.rentalNumber}</span>
                <StatusBadge status={selectedRental.status} />
              </div>
              <p className="font-semibold text-ink">{selectedRental.customerName}</p>
              <p className="text-xs text-muted mt-1">
                Due {formatDate(selectedRental.dueDate)} · {selectedRental.itemsCount} item{selectedRental.itemsCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Deposit refund */}
            <div className="border-2 border-ink rounded-2xl p-4 mb-5 text-center">
              <p className="text-xs text-muted mb-1">Deposit to refund</p>
              <RupeeAmount amount={selectedRental.depositAmount} size="xl" className="text-ink font-display font-semibold" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Refund method</Label>
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Textarea
                  placeholder="Any notes about this return..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <Button
                onClick={handleConfirm}
                disabled={returnMutation.isPending}
                size="lg"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                {returnMutation.isPending ? 'Processing...' : `Confirm Return & Refund`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
