'use client'

import { useState } from 'react'
import { Download, FileText, CalendarRange } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { formatDateInput } from '@/lib/formatters'
import { downloadInventoryPdf } from '@/lib/pdf'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function InventoryExportMenu() {
  const user = useAuthStore((s) => s.user)
  const meta = { outletName: user?.outletName ?? '', generatedBy: user?.name }

  const [open, setOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const today = formatDateInput(new Date())
  const tomorrow = formatDateInput(new Date(Date.now() + 86400000))
  const [start, setStart] = useState(today)
  const [due, setDue] = useState(tomorrow)

  async function exportFull() {
    setOpen(false)
    setBusy(true)
    try {
      const { data } = await api.get('/ornaments/export')
      await downloadInventoryPdf({ rows: data.data, mode: 'full', meta })
      toast.success(`Exported ${data.total} item(s)`)
    } catch {
      toast.error('Could not generate the inventory PDF')
    } finally {
      setBusy(false)
    }
  }

  async function exportAvailable() {
    if (due < start) {
      toast.error('Return date must be on or after the start date')
      return
    }
    setBusy(true)
    try {
      const { data } = await api.get('/ornaments/export', {
        params: { available: 'true', startDate: start, dueDate: due },
      })
      if (data.total === 0) {
        toast.info('No items are available for the selected dates')
        return
      }
      await downloadInventoryPdf({
        rows: data.data,
        mode: 'available',
        meta,
        range: { startDate: start, dueDate: due },
      })
      toast.success(`Exported ${data.total} available item(s)`)
      setDateOpen(false)
    } catch {
      toast.error('Could not generate the availability PDF')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="relative">
        <Button variant="outline" size="sm" disabled={busy} onClick={() => setOpen((o) => !o)}>
          <Download className="h-4 w-4" />
          {busy ? 'Preparing…' : 'Download'}
        </Button>

        {open && (
          <>
            {/* click-catcher to close */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-60 z-50 bg-card border border-border rounded-xl shadow-float p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={exportFull}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-surface transition-colors"
              >
                <FileText className="h-4 w-4 mt-0.5 text-muted shrink-0" />
                <span>
                  <span className="font-medium block">Full inventory</span>
                  <span className="text-xs text-muted">Every item with its status</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  setDateOpen(true)
                }}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-surface transition-colors"
              >
                <CalendarRange className="h-4 w-4 mt-0.5 text-muted shrink-0" />
                <span>
                  <span className="font-medium block">Available by date</span>
                  <span className="text-xs text-muted">Items free across a date range</span>
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Date-range dialog */}
      {dateOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => !busy && setDateOpen(false)}
          />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="font-semibold text-ink text-base">Available inventory</h3>
            <p className="mt-1 text-sm text-muted">
              Download every item that is free for the whole selected period.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-muted">
                From
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-muted">
                To
                <Input
                  type="date"
                  value={due}
                  min={start}
                  onChange={(e) => setDue(e.target.value)}
                  className="mt-1"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDateOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={exportAvailable} disabled={busy}>
                {busy ? 'Preparing…' : 'Download'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
