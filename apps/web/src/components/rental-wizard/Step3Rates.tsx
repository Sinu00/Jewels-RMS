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
    <div className="space-y-4">
      <h2 className="font-semibold text-ink">Dates & Rates</h2>

      {/* Date pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start Date *</Label>
          <Input type="date" value={startDate} onChange={(e) => setDates(e.target.value, dueDate)} />
        </div>
        <div className="space-y-1.5">
          <Label>Due/Return Date *</Label>
          <Input type="date" value={dueDate} min={startDate} onChange={(e) => setDates(startDate, e.target.value)} />
        </div>
      </div>

      <p className="text-sm text-muted">Duration: <strong>{days} day{days !== 1 ? 's' : ''}</strong></p>

      {/* Per-item rates */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Rate per day (edit to apply discount)</p>
        {selectedItems.map((item) => (
          <div key={item.ornamentId} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.ornament.name}</p>
                <p className="text-xs text-muted">{item.ornament.itemCode}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={item.ratePerDay}
                  onChange={(e) => updateItemRate(item.ornamentId, Number(e.target.value))}
                  className="w-24 text-right"
                />
                <span className="text-muted text-xs w-8 text-right">{formatINR(item.ratePerDay * days)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-xl px-4 py-3">
        <span className="font-medium text-ink">Rental Total</span>
        <RupeeAmount amount={total} size="lg" className="text-gold" />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
        <Button onClick={() => setStep(4)} disabled={!startDate || !dueDate} size="lg">
          Next: Confirm
        </Button>
      </div>
    </div>
  )
}
