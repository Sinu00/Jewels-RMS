'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate } from '@/lib/formatters'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { toast } from '@/lib/toast'
import type { PaymentPlan } from '@rental/types'

export function Step5Confirm() {
  const router = useRouter()
  const {
    customer,
    isNewCustomer,
    newCustomerData,
    selectedItems,
    startDate,
    dueDate,
    depositAmount,
    paymentMethod,
    notes,
    setDeposit,
    setPaymentMethod,
    setNotes,
    setStep,
    totalAmount,
    reset,
  } = useRentalWizardStore()

  const [error, setError] = useState('')
  const total = totalAmount()

  // Staff enter what they're collecting now; the rest is a tracked balance.
  // Default to collecting everything; quick buttons adjust both fields at once.
  const [rentNow, setRentNow] = useState<number>(total)
  const [depositNow, setDepositNow] = useState<number>(depositAmount)

  const rentCollect = Math.min(Math.max(0, rentNow || 0), total)
  const depositCollect = Math.min(Math.max(0, depositNow || 0), depositAmount)
  const rentBalance = total - rentCollect
  const depositBalance = depositAmount - depositCollect

  // The plan is just a label now — derive one that matches the amounts entered.
  const derivedPlan: PaymentPlan =
    rentCollect >= total && depositCollect >= depositAmount
      ? 'FULL_UPFRONT'
      : rentCollect >= total
        ? 'FULL_RENT_DEFER_DEPOSIT'
        : 'HALF_ADVANCE'

  const mutation = useMutation({
    mutationFn: async () => {
      let customerId = customer?.id
      if (isNewCustomer) {
        const { data: newCust } = await api.post('/customers', {
          name: newCustomerData.name,
          phone: newCustomerData.phone,
          address: newCustomerData.address || undefined,
        })
        customerId = newCust.id
        queryClient.invalidateQueries({ queryKey: keys.customers() })
      }
      return (
        await api.post('/rentals', {
          customerId,
          startDate,
          dueDate,
          depositAmount,
          paymentMethod,
          paymentPlan: derivedPlan,
          rentCollectedNow: rentCollect,
          depositCollectedNow: depositCollect,
          notes: notes || undefined,
          items: selectedItems.map((i) => ({ ornamentId: i.ornamentId, ratePerDay: i.ratePerDay })),
        })
      ).data
    },
    onSuccess: (rental) => {
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      reset()
      toast.success(`Booking ${rental.rentalNumber} created`)
      router.push(`/rentals/${rental.id}`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'Failed to create booking'
      setError(msg)
      toast.error(msg)
    },
  })

  const customerName = isNewCustomer ? newCustomerData.name : customer?.name

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink">Confirm booking</h2>

      <div className="bg-card border border-border rounded-xl divide-y divide-border text-sm">
        <div className="px-4 py-3">
          <p className="text-muted text-xs">Customer</p>
          <p className="font-medium">{customerName}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-muted text-xs">Dates</p>
          <p className="font-medium">
            {formatDate(startDate)} → {formatDate(dueDate)}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-muted text-xs">Items ({selectedItems.length})</p>
          {selectedItems.map((i) => (
            <p key={i.ornamentId} className="text-ink">
              {i.ornament.name} — {formatINR(i.ratePerDay)}/day
            </p>
          ))}
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-muted text-xs">Rental total</p>
          <RupeeAmount amount={total} size="md" />
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-muted text-xs">Deposit</p>
          <RupeeAmount amount={depositAmount} size="md" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Deposit amount (₹) *</Label>
        <Input
          type="number"
          min="0"
          value={depositAmount || ''}
          onChange={(e) => {
            const v = Number(e.target.value)
            setDeposit(v)
            // Keep "deposit collecting now" tracking the agreed deposit by default.
            setDepositNow(v)
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Collecting now</Label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => { setRentNow(total); setDepositNow(depositAmount) }}
              className="text-xs px-2 py-1 rounded-full bg-surface border border-border hover:border-ink/40"
            >Full</button>
            <button
              type="button"
              onClick={() => { setRentNow(Math.round(total / 2)); setDepositNow(0) }}
              className="text-xs px-2 py-1 rounded-full bg-surface border border-border hover:border-ink/40"
            >Half rent</button>
            <button
              type="button"
              onClick={() => { setRentNow(0); setDepositNow(0) }}
              className="text-xs px-2 py-1 rounded-full bg-surface border border-border hover:border-ink/40"
            >Nothing</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted">Rent (of {formatINR(total)})</p>
            <Input
              type="number"
              min="0"
              max={total}
              value={rentNow || ''}
              onChange={(e) => setRentNow(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted">Deposit (of {formatINR(depositAmount)})</p>
            <Input
              type="number"
              min="0"
              max={depositAmount}
              value={depositNow || ''}
              onChange={(e) => setDepositNow(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Payment method</Label>
        <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </Select>
      </div>

      <div className="bg-surface border border-border rounded-xl px-4 py-3 text-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">Collecting now</span>
          <RupeeAmount amount={rentCollect + depositCollect} size="md" className="text-ink" />
        </div>
        {(rentBalance > 0 || depositBalance > 0) && (
          <p className="text-xs text-muted">
            Balance at pickup ({formatDate(startDate)}):{' '}
            {rentBalance > 0 && `rent ${formatINR(rentBalance)}`}
            {rentBalance > 0 && depositBalance > 0 && ' + '}
            {depositBalance > 0 && `deposit ${formatINR(depositBalance)}`}
          </p>
        )}
        {depositBalance > 0 && (
          <p className="text-xs text-amber-700">Full deposit must be collected before handover.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(4)}>
          Back
        </Button>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (!customer && !isNewCustomer)}
          size="lg"
        >
          {mutation.isPending ? 'Booking…' : 'Confirm booking'}
        </Button>
      </div>
    </div>
  )
}
