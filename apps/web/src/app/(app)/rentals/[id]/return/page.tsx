'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatDate, formatINR } from '@/lib/formatters'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  // Empty string until the rental loads; then defaults to the full deposit.
  const [returnedDeposit, setReturnedDeposit] = useState<string>('')

  const { data: rental, isLoading } = useQuery<Rental>({
    queryKey: keys.rental(id),
    queryFn: async () => (await api.get(`/rentals/${id}`)).data,
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/rentals/${id}/return`, {
        method,
        note,
        returnedDepositAmount: Number(returnedDeposit),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rental(id) })
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      router.push(`/rentals/${id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to process return'),
  })

  // Default the editable field to the full deposit once the rental loads.
  useEffect(() => {
    if (rental?.depositCollected) {
      setReturnedDeposit((v) => (v === '' ? String(Number(rental.depositAmount)) : v))
    }
  }, [rental])

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

  const balanceDue = rental.rentalDue ?? 0
  const depositTotal = Number(rental.depositAmount)
  const hasDeposit = rental.depositCollected && depositTotal > 0
  const returnedNum = returnedDeposit === '' ? depositTotal : Number(returnedDeposit)
  const withheld = Math.max(0, depositTotal - returnedNum)
  const depositInvalid = hasDeposit && (Number.isNaN(returnedNum) || returnedNum < 0 || returnedNum > depositTotal)

  return (
    <div>
      <PageHeader
        title="Process Return"
        subtitle={`${rental.rentalNumber} · ${rental.customer.name}`}
        back={`/rentals/${id}`}
      />

      <div className="px-5 md:px-6 max-w-xl mx-auto space-y-5 pb-8">

        {/* Items being returned */}
        <div>
          <p className="text-xs text-muted font-medium mb-2">Returning {rental.items.length} item{rental.items.length !== 1 ? 's' : ''}</p>
          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {rental.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                <div className="w-1.5 h-1.5 rounded-full bg-ink shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{item.ornament.name}</p>
                  <p className="item-code">{item.ornament.itemCode}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding rent balance to collect (e.g. from an unpaid extension) */}
        {balanceDue > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Collect rent balance</p>
              <p className="text-xs text-amber-800 mt-0.5">Unpaid rent / extension on this rental</p>
            </div>
            <span className="font-display font-semibold text-amber-900">{formatINR(balanceDue)}</span>
          </div>
        )}

        {/* Deposit settlement — editable refund, with any withheld amount tracked */}
        {hasDeposit ? (
          <div className="rounded-2xl border-2 border-ink bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Deposit returned to customer
              </p>
              <span className="text-xs text-muted">of {formatINR(depositTotal)}</span>
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
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Security deposit · collected {formatDate(rental.startDate)}</span>
              {withheld > 0 && !depositInvalid && (
                <span className="font-semibold text-amber-700">Withheld {formatINR(withheld)}</span>
              )}
            </div>
            {depositInvalid && (
              <p className="text-xs text-red-600">Enter an amount between 0 and {formatINR(depositTotal)}.</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-sm text-muted">No security deposit was collected for this rental.</p>
          </div>
        )}

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
          disabled={mutation.isPending || depositInvalid}
        >
          {mutation.isPending
            ? 'Processing…'
            : [
                balanceDue > 0 ? `Collect ${formatINR(balanceDue)}` : null,
                hasDeposit ? `Refund ${formatINR(returnedNum)}` : null,
                hasDeposit && withheld > 0 ? `Withhold ${formatINR(withheld)}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Confirm return'}
        </Button>
      </div>
    </div>
  )
}
