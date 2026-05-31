'use client'

import { formatINR, formatDate } from '@/lib/formatters'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RupeeAmount } from '@/components/shared/RupeeAmount'

export function Step4Pricing() {
  const { selectedItems, startDate, dueDate, updateItemRate, setStep, setDeposit, depositAmount, totalDays, totalAmount } =
    useRentalWizardStore()
  const days = totalDays()
  const total = totalAmount()

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted bg-surface border border-border rounded-xl px-4 py-3">
        <span className="font-medium text-ink">{formatDate(startDate)}</span>
        {' → '}
        <span className="font-medium text-ink">{formatDate(dueDate)}</span>
        <span className="ml-2">({days} day{days !== 1 ? 's' : ''})</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Rates per day</p>
          <p className="text-xs text-muted">Adjust to give discount</p>
        </div>

        {selectedItems.map((item) => {
          const isDiscounted = item.ratePerDay < item.ornament.baseRatePerDay
          const subtotal = item.ratePerDay * days
          return (
            <div key={item.ornamentId} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 pt-3 pb-2">
                <p className="text-sm font-semibold text-ink line-clamp-1">{item.ornament.name}</p>
                <p className="text-xs text-muted mt-0.5">{item.ornament.itemCode}</p>
              </div>
              <div className="flex items-center gap-0 border-t border-border">
                <div className="flex-1 flex items-center gap-2 px-4 py-3">
                  <span className="text-sm text-muted font-medium">₹</span>
                  <Input
                    type="number"
                    min="0"
                    value={item.ratePerDay}
                    onChange={(e) => updateItemRate(item.ornamentId, Number(e.target.value))}
                    className="h-10 w-28 text-right font-semibold text-base border-0 bg-surface rounded-xl px-3"
                  />
                  <span className="text-xs text-muted whitespace-nowrap">/ day</span>
                </div>
                <div className="shrink-0 px-4 py-3 text-right border-l border-border">
                  <p className="text-base font-display font-semibold text-ink">{formatINR(subtotal)}</p>
                  {isDiscounted && (
                    <p className="text-xs text-muted line-through mt-0.5">
                      {formatINR(item.ornament.baseRatePerDay * days)}
                    </p>
                  )}
                  {days > 1 && <p className="text-xs text-muted mt-0.5">× {days} days</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between bg-surface border border-border rounded-2xl px-5 py-4">
        <span className="font-semibold text-ink">Rental total</span>
        <RupeeAmount amount={total} size="lg" className="text-ink" />
      </div>

      <div className="space-y-1.5">
        <Label>Security deposit (₹) *</Label>
        <Input
          type="number"
          min="0"
          placeholder="Deposit collected on pickup (unless full upfront)"
          value={depositAmount || ''}
          onChange={(e) => setDeposit(Number(e.target.value))}
        />
      </div>

      <div className="flex gap-3 pb-4">
        <Button variant="outline" size="lg" onClick={() => setStep(3)}>Back</Button>
        <Button size="lg" className="flex-1" onClick={() => setStep(5)}>
          Continue to booking
        </Button>
      </div>
    </div>
  )
}
