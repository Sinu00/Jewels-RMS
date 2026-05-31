'use client'

import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateInput } from '@/lib/formatters'

function addDays(base: string, days: number): string {
  const d = base ? new Date(base) : new Date()
  d.setDate(d.getDate() + days)
  return formatDateInput(d)
}

export function Step1Dates() {
  const { startDate, dueDate, setDates, setStep, totalDays } = useRentalWizardStore()
  const days = totalDays()
  const today = formatDateInput(new Date())

  // Anchor the return-date shortcuts to the chosen pickup date (or today).
  const anchor = startDate || today
  const returnShortcuts = [
    { label: '+1 day', days: 1 },
    { label: '+3 days', days: 3 },
    { label: '+7 days', days: 7 },
  ]

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink">Event dates</h2>
      <p className="text-sm text-muted">Choose pickup and return dates first. Only ornaments free for these dates will be shown next.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Pickup date</Label>
          <Input
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => setDates(e.target.value, dueDate < e.target.value ? e.target.value : dueDate)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Return date</Label>
          <Input
            type="date"
            min={startDate}
            value={dueDate}
            onChange={(e) => setDates(startDate, e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDates(today, dueDate < today ? today : dueDate)}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-surface text-muted hover:text-ink hover:border-ink transition-colors"
        >
          Pickup today
        </button>
        <span className="text-xs text-muted">·</span>
        {returnShortcuts.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setDates(anchor, addDays(anchor, s.days))}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-surface text-muted hover:text-ink hover:border-ink transition-colors"
          >
            Return {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-3 py-1 rounded-full">
          {days} day{days !== 1 ? 's' : ''}
        </span>
        <span className="text-sm text-muted">rental duration</span>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={() => setStep(2)} disabled={!startDate || !dueDate || dueDate < startDate}>
          Next: Choose ornaments
        </Button>
      </div>
    </div>
  )
}
