'use client'

import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, ArrowLeft, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatDate, formatINR, formatDateInput } from '@/lib/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { toast } from '@/lib/toast'

export default function GenericPickupPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [method, setMethod] = useState('CASH')
  const [error, setError] = useState('')

  const today = formatDateInput(new Date())

  // Default (no search): today's scheduled pickups. While searching: all matching bookings.
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: keys.rentals({ search: debouncedSearch, booked: true, pickupDay: debouncedSearch ? null : today }),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', status: 'BOOKED' })
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      } else {
        params.set('startDate', today)
      }
      const res = await api.get(`/rentals?${params}`)
      return (res.data.data as any[]).filter((r: any) => r.status === 'BOOKED')
    },
  })

  // Fetch full detail (with pickup-due breakdown) for the selected booking.
  const { data: selectedRental, isLoading: loadingDetail } = useQuery({
    queryKey: keys.rental(selectedId ?? ''),
    queryFn: async () => (await api.get(`/rentals/${selectedId}`)).data,
    enabled: !!selectedId,
  })

  const pickupMutation = useMutation({
    mutationFn: async ({ id, method }: { id: string; method: string }) =>
      (await api.post(`/rentals/${id}/pickup`, { method })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.rental(data.id) })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      toast.success(`Pickup completed for ${data.rentalNumber}`)
      router.push(`/rentals/${data.id}`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'Failed to complete pickup'
      setError(msg)
      toast.error(msg)
    },
  })

  function handleConfirm() {
    if (!selectedRental) return
    setError('')
    pickupMutation.mutate({ id: selectedRental.id, method })
  }

  const amountDue = selectedRental ? (selectedRental.amountDueOnPickup ?? 0) : 0

  return (
    <div>
      <PageHeader title="Complete Pickup" back="/dashboard" />

      <div className="px-5 md:px-6 max-w-2xl mx-auto pb-8">
        {!selectedId ? (
          <>
            <p className="text-sm text-muted mb-4">Search by customer name or rental number, or pick from today&apos;s scheduled pickups below.</p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {search.length === 0 && !searching && (searchResults?.length ?? 0) > 0 && (
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Today&apos;s pickups</p>
            )}

            {searching && <LoadingSpinner />}

            {searchResults && searchResults.length === 0 && !searching && (
              <p className="text-sm text-muted text-center py-6">
                {search.length > 0 ? 'No bookings found' : 'No pickups scheduled for today'}
              </p>
            )}

            <div className="space-y-2">
              {searchResults?.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedId(r.id); setError('') }}
                  className="w-full text-left bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-ink hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="item-code font-mono text-xs">{r.rentalNumber}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="font-medium text-ink">{r.customerName}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Pickup {formatDate(r.startDate)} · {r.itemsCount} item{r.itemsCount !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { setSelectedId(null); setError('') }}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </button>

            {loadingDetail || !selectedRental ? (
              <LoadingSpinner />
            ) : (
              <>
                {/* Selected rental summary */}
                <div className="bg-card border border-border rounded-2xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="item-code font-mono text-xs">{selectedRental.rentalNumber}</span>
                    <StatusBadge status={selectedRental.status} />
                  </div>
                  <p className="font-semibold text-ink">{selectedRental.customer.name}</p>
                  <p className="text-xs text-muted mt-1">
                    Pickup {formatDate(selectedRental.startDate)} · {selectedRental.items.length} item{selectedRental.items.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Amount due on pickup */}
                {amountDue > 0 ? (
                  <div className="border-2 border-ink rounded-2xl p-4 mb-5 text-center">
                    <p className="text-xs text-muted mb-1">Collect from customer</p>
                    <RupeeAmount amount={amountDue} size="xl" className="text-ink font-display font-semibold" />
                    <div className="mt-2 space-y-0.5">
                      {(selectedRental.rentalDue ?? 0) > 0 && (
                        <p className="text-xs text-muted">Rent balance: {formatINR(selectedRental.rentalDue ?? 0)}</p>
                      )}
                      {(selectedRental.depositDue ?? 0) > 0 && (
                        <p className="text-xs text-muted">Deposit: {formatINR(selectedRental.depositDue ?? 0)}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 mb-5 bg-surface border border-border text-center">
                    <p className="text-sm text-muted">All payments already collected. Confirm handing over the ornaments.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {amountDue > 0 && (
                    <div className="space-y-1.5">
                      <Label>Payment method</Label>
                      <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </Select>
                    </div>
                  )}

                  {!selectedRental.canPickup && (
                    <p className="text-sm text-muted bg-surface border border-border rounded-lg px-3 py-2">
                      Pickup available from {formatDate(selectedRental.startDate)}
                    </p>
                  )}

                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                  <Button
                    onClick={handleConfirm}
                    disabled={pickupMutation.isPending || !selectedRental.canPickup}
                    size="lg"
                    className="w-full"
                  >
                    <Package className="h-4 w-4" />
                    {pickupMutation.isPending
                      ? 'Processing...'
                      : amountDue > 0
                        ? 'Confirm Pickup & Collect'
                        : 'Confirm Pickup'}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
