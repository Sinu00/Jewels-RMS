'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { formatDate, formatDateInput } from '@/lib/formatters'
import { downloadAccountsPdf } from '@/lib/pdf'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Preset = 'today' | 'month' | 'year' | 'custom'

const monthYear = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' })

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/** Build an inclusive local-time range + a human label for the chosen period. */
function computeRange(preset: Preset, customFrom: string, customTo: string) {
  const now = new Date()
  if (preset === 'today') {
    return { from: startOfDay(now), to: endOfDay(now), label: `Today (${formatDate(now)})` }
  }
  if (preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from, to: endOfDay(now), label: `This month (${monthYear.format(now)})` }
  }
  if (preset === 'year') {
    const from = new Date(now.getFullYear(), 0, 1)
    return { from, to: endOfDay(now), label: `This year (${now.getFullYear()})` }
  }
  const [fy, fm, fd] = customFrom.split('-').map(Number)
  const [ty, tm, td] = customTo.split('-').map(Number)
  const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0)
  const to = new Date(ty, tm - 1, td, 23, 59, 59, 999)
  return { from, to, label: `${formatDate(from)} – ${formatDate(to)}` }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
]

export function AccountsExportButton() {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preset, setPreset] = useState<Preset>('month')

  const today = formatDateInput(new Date())
  const [customFrom, setCustomFrom] = useState(today)
  const [customTo, setCustomTo] = useState(today)

  async function download() {
    if (preset === 'custom' && customTo < customFrom) {
      toast.error('End date must be on or after the start date')
      return
    }
    setBusy(true)
    try {
      const { from, to, label } = computeRange(preset, customFrom, customTo)
      const { data } = await api.get('/payments/export', {
        params: { incomeOnly: 'true', from: from.toISOString(), to: to.toISOString() },
      })
      if (data.total === 0) {
        toast.info('No rental income for the selected period')
        return
      }
      await downloadAccountsPdf({
        rows: data.data,
        meta: { outletName: user?.outletName ?? '', generatedBy: user?.name },
        periodLabel: label,
      })
      toast.success(`Exported ${data.total} record(s)`)
      setOpen(false)
    } catch {
      toast.error('Could not generate the report')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4" />
        Download PDF
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => !busy && setOpen(false)}
          />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="font-semibold text-ink text-base">Download rental income</h3>
            <p className="mt-1 text-sm text-muted">Choose the period to include in the report.</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={`h-10 rounded-xl text-sm font-medium border transition-colors ${
                    preset === p.key
                      ? 'bg-ink text-white border-ink'
                      : 'border-border text-ink hover:bg-surface'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-xs text-muted">
                  From
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1"
                  />
                </label>
                <label className="text-xs text-muted">
                  To
                  <Input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1"
                  />
                </label>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={download} disabled={busy}>
                {busy ? 'Preparing…' : 'Download'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
