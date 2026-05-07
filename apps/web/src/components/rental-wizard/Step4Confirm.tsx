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

export function Step4Confirm() {
  const router = useRouter()
  const {
    customer, isNewCustomer, newCustomerData,
    selectedItems, startDate, dueDate,
    depositAmount, depositMethod,
    notes, setDeposit, setNotes, setStep, totalAmount, reset,
  } = useRentalWizardStore()

  const [error, setError] = useState('')
  const total = totalAmount()

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
      return (await api.post('/rentals', {
        customerId,
        startDate,
        dueDate,
        depositAmount,
        depositMethod,
        notes: notes || undefined,
        items: selectedItems.map((i) => ({ ornamentId: i.ornamentId, ratePerDay: i.ratePerDay })),
      })).data
    },
    onSuccess: (rental) => {
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      reset()
      router.push(`/rentals/${rental.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to create rental'),
  })

  const customerName = isNewCustomer ? newCustomerData.name : customer?.name

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink">Confirm Rental</h2>

      {/* Summary */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border text-sm">
        <div className="px-4 py-3">
          <p className="text-muted text-xs">Customer</p>
          <p className="font-medium">{customerName}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-muted text-xs">Items ({selectedItems.length})</p>
          {selectedItems.map((i) => (
            <p key={i.ornamentId} className="text-ink">{i.ornament.name} — {formatINR(i.ratePerDay)}/day</p>
          ))}
        </div>
        <div className="px-4 py-3 grid grid-cols-2 gap-2">
          <div>
            <p className="text-muted text-xs">Start Date</p>
            <p className="font-medium">{formatDate(startDate)}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Due Date</p>
            <p className="font-medium">{formatDate(dueDate)}</p>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-muted text-xs">Rental Total</p>
          <RupeeAmount amount={total} size="md" />
        </div>
      </div>

      {/* Deposit */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Security Deposit (₹) *</Label>
          <Input
            type="number"
            min="0"
            placeholder="Enter deposit amount"
            value={depositAmount || ''}
            onChange={(e) => setDeposit(Number(e.target.value), depositMethod)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Method *</Label>
          <Select value={depositMethod} onChange={(e) => setDeposit(depositAmount, e.target.value as any)}>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </Select>
        </div>
      </div>

      {/* Deposit highlight */}
      <div className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-xl px-4 py-3">
        <span className="text-sm font-medium">Collecting from customer today</span>
        <RupeeAmount amount={total + depositAmount} size="lg" className="text-gold" />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !depositAmount}
          size="lg"
        >
          {mutation.isPending ? 'Creating...' : 'Confirm Rental'}
        </Button>
      </div>
    </div>
  )
}
