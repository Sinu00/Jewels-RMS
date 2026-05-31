'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate, formatDateInput } from '@/lib/formatters'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { toast } from '@/lib/toast'
import { PAYMENT_PLAN_LABELS, type PaymentPlan } from '@rental/types'

const PLANS: PaymentPlan[] = ['HALF_ADVANCE', 'FULL_RENT_DEFER_DEPOSIT', 'FULL_UPFRONT']

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
    paymentPlan,
    paymentMethod,
    notes,
    setDeposit,
    setPaymentPlan,
    setPaymentMethod,
    setNotes,
    setStep,
    totalAmount,
    bookingPaymentToday,
    reset,
  } = useRentalWizardStore()

  const [error, setError] = useState('')
  const total = totalAmount()
  const collectingToday = bookingPaymentToday()
  const today = formatDateInput(new Date())
  const isSameDayPickup = startDate <= today

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
          paymentPlan,
          notes: notes || undefined,
          autoPickup: isSameDayPickup && paymentPlan === 'FULL_UPFRONT',
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

      <div className="space-y-2">
        <Label>Payment plan</Label>
        {PLANS.map((plan) => (
          <button
            key={plan}
            type="button"
            onClick={() => setPaymentPlan(plan)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
              paymentPlan === plan ? 'border-ink bg-surface' : 'border-border bg-card hover:border-ink/30'
            }`}
          >
            <p className="text-sm font-medium text-ink">{PAYMENT_PLAN_LABELS[plan]}</p>
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label>Deposit amount (₹) *</Label>
        <Input
          type="number"
          min="0"
          value={depositAmount || ''}
          onChange={(e) => setDeposit(Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Payment method (collected today)</Label>
        <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </Select>
      </div>

      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
        <span className="text-sm font-medium">Collecting today</span>
        <RupeeAmount amount={collectingToday} size="lg" className="text-ink" />
      </div>

      {paymentPlan !== 'FULL_UPFRONT' && (
        <p className="text-xs text-muted">
          Deposit {formatINR(depositAmount)}
          {paymentPlan === 'HALF_ADVANCE' ? ` and remaining rent ` : ' '}
          will be collected on pickup ({formatDate(startDate)}).
        </p>
      )}

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
