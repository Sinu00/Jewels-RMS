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
import { toast } from '@/lib/toast'

export default function GenericReturnPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [selectedRental, setSelectedRental] = useState<any>(null)
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [returnedDeposit, setReturnedDeposit] = useState('')
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
    mutationFn: async ({
      id,
      method,
      note,
      returnedDepositAmount,
    }: {
      id: string
      method: string
      note: string
      returnedDepositAmount: number
    }) =>
      (await api.post(`/rentals/${id}/return`, { method, note: note || undefined, returnedDepositAmount })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.rental(data.id) })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      toast.success(`Return completed for ${data.rentalNumber}`)
      router.push(`/rentals/${data.id}`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'Failed to process return'
      setError(msg)
      toast.error(msg)
    },
  })

  function selectRental(r: any) {
    setSelectedRental(r)
    setReturnedDeposit(String(Number(r.depositAmount)))
    setError('')
  }

  const depositTotal = selectedRental ? Number(selectedRental.depositAmount) : 0
  const hasDeposit = !!selectedRental?.depositCollected && depositTotal > 0
  const returnedNum = returnedDeposit === '' ? depositTotal : Number(returnedDeposit)
  const withheld = Math.max(0, depositTotal - returnedNum)
  const depositInvalid = hasDeposit && (Number.isNaN(returnedNum) || returnedNum < 0 || returnedNum > depositTotal)

  function handleConfirm() {
    if (!selectedRental || depositInvalid) return
    setError('')
    returnMutation.mutate({ id: selectedRental.id, method, note, returnedDepositAmount: returnedNum })
  }

  return (
    <div>
      <PageHeader title="Process Return" back="/dashboard" />

      <div className="px-5 md:px-6 max-w-2xl mx-auto pb-8">
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
                  onClick={() => selectRental(r)}
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
              onClick={() => { setSelectedRental(null); setReturnedDeposit(''); setError('') }}
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

            {/* Deposit settlement — editable refund, any withheld amount tracked */}
            {hasDeposit ? (
              <div className="border-2 border-ink rounded-2xl p-4 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted">Deposit returned to customer</p>
                  <span className="text-xs text-muted">of <RupeeAmount amount={depositTotal} /></span>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={depositTotal}
                  value={returnedDeposit}
                  onChange={(e) => setReturnedDeposit(e.target.value)}
                  className="h-12 text-2xl font-display text-ink"
                />
                {withheld > 0 && !depositInvalid && (
                  <p className="text-xs text-amber-700 font-semibold text-right">
                    Withheld <RupeeAmount amount={withheld} />
                  </p>
                )}
                {depositInvalid && (
                  <p className="text-xs text-red-600">Enter an amount between 0 and the deposit collected.</p>
                )}
              </div>
            ) : (
              <div className="border border-border rounded-2xl p-4 mb-5 text-center">
                <p className="text-sm text-muted">No security deposit was collected for this rental.</p>
              </div>
            )}

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
                disabled={returnMutation.isPending || depositInvalid}
                size="lg"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                {returnMutation.isPending
                  ? 'Processing...'
                  : hasDeposit && withheld > 0
                    ? 'Confirm Return · Withhold deposit'
                    : 'Confirm Return & Refund'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
