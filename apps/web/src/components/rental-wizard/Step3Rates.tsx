'use client'

import { formatINR } from '@/lib/formatters'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RupeeAmount } from '@/components/shared/RupeeAmount'

export function Step3Rates() {
  const { selectedItems, startDate, dueDate, setDates, updateItemRate, setStep, totalDays, totalAmount } = useRentalWizardStore()
  const days = totalDays()
  const total = totalAmount()

  return (
    <div className="space-y-6">

      {/* ── 1. Dates ── */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setDates(e.target.value, dueDate)} />
          </div>
          <div className="space-y-1.5">
            <Label>Return date</Label>
            <Input type="date" value={dueDate} min={startDate} onChange={(e) => setDates(startDate, e.target.value)} />
          </div>
        </div>

        {/* Duration pill */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-3 py-1 rounded-full">
            {days} day{days !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-muted">rental duration</span>
        </div>
      </div>

      {/* ── 2. Per-item rates ── */}
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
              {/* Item name row */}
              <div className="px-4 pt-3 pb-2">
                <p className="text-sm font-semibold text-ink line-clamp-1">{item.ornament.name}</p>
                <p className="text-xs text-muted mt-0.5">{item.ornament.itemCode}</p>
              </div>

              {/* Rate + subtotal row */}
              <div className="flex items-center gap-0 border-t border-border">
                {/* Rate input */}
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

                {/* Subtotal */}
                <div className="shrink-0 px-4 py-3 text-right border-l border-border">
                  <p className="text-base font-display font-semibold text-ink">
                    {formatINR(subtotal)}
                  </p>
                  {isDiscounted && (
                    <p className="text-xs text-muted line-through mt-0.5">
                      {formatINR(item.ornament.baseRatePerDay * days)}
                    </p>
                  )}
                  {days > 1 && (
                    <p className="text-xs text-muted mt-0.5">
                      × {days} days
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 3. Total ── */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-2xl px-5 py-4">
        <span className="font-semibold text-ink">Rental total</span>
        <RupeeAmount amount={total} size="lg" className="text-ink" />
      </div>

      {/* ── 4. Navigation ── */}
      <div className="flex gap-3 pb-4">
        <Button variant="outline" size="lg" onClick={() => setStep(2)}>Back</Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={() => setStep(4)}
          disabled={!startDate || !dueDate}
        >
          Continue to Confirm
        </Button>
      </div>
    </div>
  )
}
