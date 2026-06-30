'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MessageCircle, Calendar, AlertTriangle, Phone, Package, CalendarClock } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate, formatDateInput, buildBillMessage, buildBookingMessage, buildReminderMessage } from '@/lib/formatters'
import { PAYMENT_PLAN_LABELS } from '@rental/types'
import { useAuthStore } from '@/stores/authStore'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { WhatsAppButton } from '@/components/shared/WhatsAppButton'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { CopyButton } from '@/components/shared/CopyButton'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Rental, PaymentMethod } from '@rental/types'

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0
  // Inclusive of both the pickup day and the return day: 16th → 17th = 2 days.
  const diffDays = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

function addDaysTo(dateStr: string, n: number): Date {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d
}

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [showExtend, setShowExtend] = useState(false)
  const [showPickup, setShowPickup] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [pickupMethod, setPickupMethod] = useState<PaymentMethod>('CASH')
  const [pickupRent, setPickupRent] = useState('')
  const [pickupDeposit, setPickupDeposit] = useState('')
  const [cancelRentRefund, setCancelRentRefund] = useState('')
  const [cancelDepositRefund, setCancelDepositRefund] = useState('')
  const [cancelMethod, setCancelMethod] = useState<PaymentMethod>('CASH')
  const [cancelNote, setCancelNote] = useState('')
  const [reason, setReason] = useState('')
  const [extendDays, setExtendDays] = useState('1')
  const [extendRate, setExtendRate] = useState('')
  const [extendPaid, setExtendPaid] = useState(true)
  const [extendMethod, setExtendMethod] = useState<PaymentMethod>('CASH')
  const [newStart, setNewStart] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newTotal, setNewTotal] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')

  const { data: rental, isLoading } = useQuery<Rental>({
    queryKey: keys.rental(id),
    queryFn: async () => (await api.get(`/rentals/${id}`)).data,
  })

  const extendMutation = useMutation({
    mutationFn: () => {
      const d = Math.max(1, parseInt(extendDays) || 1)
      const rate = Number(extendRate) || 0
      return api.post(`/rentals/${id}/extend`, {
        extraDays: d,
        amount: d * rate,
        markPaid: extendPaid,
        method: extendMethod,
        reason,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rental(id) })
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      queryClient.invalidateQueries({ queryKey: keys.payments() })
      setShowExtend(false)
      toast.success('Rental extended')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to extend rental'),
  })

  const pickupMutation = useMutation({
    mutationFn: () =>
      api.post(`/rentals/${id}/pickup`, {
        method: pickupMethod,
        rentCollected: Number(pickupRent) || 0,
        depositCollected: Number(pickupDeposit) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rental(id) })
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      setShowPickup(false)
      toast.success('Pickup completed')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to complete pickup'),
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.post(`/rentals/${id}/cancel`, {
        note: cancelNote || undefined,
        method: cancelMethod,
        rentRefund: Number(cancelRentRefund) || 0,
        depositRefund: Number(cancelDepositRefund) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rental(id) })
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      queryClient.invalidateQueries({ queryKey: keys.payments() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      setShowCancel(false)
      toast.success('Booking cancelled')
    },
    onError: (err: any) => {
      setShowCancel(false)
      toast.error(err.response?.data?.error ?? 'Failed to cancel booking')
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      api.post(`/rentals/${id}/reschedule`, {
        startDate: newStart,
        dueDate: newDue,
        totalRentalAmount: newTotal === '' ? undefined : Number(newTotal),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rental(id) })
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      queryClient.invalidateQueries({ queryKey: keys.dashboard() })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      setShowReschedule(false)
      toast.success('Booking dates updated')
    },
    onError: (err: any) =>
      setRescheduleError(err.response?.data?.error ?? 'Failed to change dates'),
  })

  if (isLoading) return <LoadingSpinner />
  if (!rental) return <div className="p-6 text-muted">Rental not found</div>

  const outletName = user?.outletName ?? 'Our Shop'
  const isBooked = rental.status === 'BOOKED'
  const isOut = ['ACTIVE', 'OVERDUE', 'EXTENDED'].includes(rental.status)
  const canAct = isBooked || isOut
  const billMsg = isBooked
    ? buildBookingMessage(rental, outletName)
    : buildBillMessage(rental, outletName)
  const reminderMsg = buildReminderMessage(rental)

  // Sum of per-day rates across items — used to auto-recompute the total when dates change.
  const ratePerDayTotal = rental.items.reduce((sum, item) => sum + item.ratePerDay, 0)

  function openReschedule() {
    if (!rental) return
    const start = formatDateInput(rental.startDate)
    const due = formatDateInput(rental.dueDate)
    setNewStart(start)
    setNewDue(due)
    setNewTotal(String(rental.totalRentalAmount))
    setRescheduleError('')
    setShowReschedule(true)
  }

  function applyDates(start: string, due: string) {
    setNewStart(start)
    setNewDue(due)
    // Auto-recompute the suggested total for the new duration (still editable below).
    setNewTotal(String(ratePerDayTotal * daysBetween(start, due)))
  }

  const rescheduleDays = daysBetween(newStart, newDue)

  function openPickup() {
    if (!rental) return
    // Pre-fill with the balances owed; staff can collect less rent, but the
    // deposit field is gated to the full amount before handover.
    setPickupRent(String(rental.rentalDue ?? 0))
    setPickupDeposit(String(rental.depositDue ?? 0))
    setPickupMethod('CASH')
    setShowPickup(true)
  }

  function openCancel() {
    if (!rental) return
    // Default to refunding everything collected; staff can keep a fee.
    setCancelRentRefund(String(rental.rentalPaid ?? 0))
    setCancelDepositRefund(String(rental.depositPaid ?? 0))
    setCancelMethod('CASH')
    setCancelNote('')
    setShowCancel(true)
  }

  function openExtend() {
    setExtendDays('1')
    setExtendRate(String(ratePerDayTotal))
    setExtendPaid(true)
    setExtendMethod('CASH')
    setReason('')
    setShowExtend(true)
  }

  // Live preview values for the extend modal.
  const extDays = Math.max(1, parseInt(extendDays) || 1)
  const extRate = Number(extendRate) || 0
  const extAmount = extDays * extRate

  return (
    <div>
      <PageHeader
        title={rental.rentalNumber}
        back="/rentals"
        action={
          <>
            {rental.daysOverdue > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                <AlertTriangle className="h-3.5 w-3.5" />
                {rental.daysOverdue}d overdue
              </span>
            )}
            <CopyButton value={rental.rentalNumber} label="Rental number copied" className="h-9 w-9 bg-surface border border-border" />
          </>
        }
      />

      <div className="px-5 md:px-6 max-w-2xl mx-auto space-y-4 pb-32 md:pb-8">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusBadge status={rental.status} />
              <p className="text-xs text-muted mt-2">{PAYMENT_PLAN_LABELS[rental.paymentPlan]}</p>
              <Link
                href={`/customers/${rental.customerId}`}
                className="block mt-2 text-base font-semibold text-ink hover:text-muted transition-colors"
              >
                {rental.customer.name}
              </Link>
              <p className="text-sm text-muted mt-0.5">{rental.customer.phone}</p>
            </div>
            <a
              href={`tel:${rental.customer.phone}`}
              className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0"
            >
              <Phone className="h-4 w-4 text-muted" />
            </a>
          </div>
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Pickup</p>
              <p className="font-medium mt-0.5">{formatDate(rental.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Return</p>
              <p className={`font-medium mt-0.5 ${rental.daysOverdue > 0 ? 'text-red-600' : ''}`}>
                {formatDate(rental.dueDate)}
              </p>
            </div>
            {rental.returnedAt && (
              <div>
                <p className="text-xs text-muted">Returned</p>
                <p className="font-medium mt-0.5">{formatDate(rental.returnedAt)}</p>
              </div>
            )}
            {rental.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted">Notes</p>
                <p className="text-ink mt-0.5">{rental.notes}</p>
              </div>
            )}
          </div>
        </div>

        {isBooked && (rental.amountDueOnPickup ?? 0) > 0 && (
          <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-900">Due on pickup</p>
            <RupeeAmount amount={rental.amountDueOnPickup ?? 0} size="lg" className="text-amber-900 mt-1" />
            {(rental.rentalDue ?? 0) > 0 && (
              <p className="text-xs text-amber-800 mt-1">Rent balance: {formatINR(rental.rentalDue ?? 0)}</p>
            )}
            {(rental.depositDue ?? 0) > 0 && (
              <p className="text-xs text-amber-800">Deposit: {formatINR(rental.depositDue ?? 0)}</p>
            )}
          </div>
        )}

        {isOut && (rental.rentalDue ?? 0) > 0 && (
          <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-900">Rent due</p>
            <RupeeAmount amount={rental.rentalDue ?? 0} size="lg" className="text-amber-900 mt-1" />
            <p className="text-xs text-amber-800 mt-1">Collect the balance at return.</p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-3">Items ({rental.items.length})</p>
          <div className="space-y-2">
            {rental.items.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">{item.ornament.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {item.ornament.itemCode} · {formatINR(item.ratePerDay)}/day
                  </p>
                </div>
                <p className="font-display font-semibold text-base">{formatINR(item.totalAmount)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="text-sm text-muted">Rental total</span>
            <RupeeAmount amount={rental.totalRentalAmount} size="md" />
          </div>
          {(rental.rentalPaid ?? 0) > 0 && (
            <p className="text-xs text-muted mt-1 px-1">Paid so far: {formatINR(rental.rentalPaid ?? 0)}</p>
          )}
        </div>

        <div className="rounded-2xl p-4 bg-card border border-border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">Security Deposit</p>
              <p className="text-xs text-muted mt-0.5">
                {rental.depositRefunded
                  ? 'Refunded to customer'
                  : rental.depositCollected
                    ? 'Collected'
                    : 'Due on pickup'}
              </p>
            </div>
            <RupeeAmount
              amount={rental.depositAmount}
              size="lg"
              className={rental.depositRefunded ? 'text-muted line-through' : 'text-ink'}
            />
          </div>
        </div>

        {canAct && (
          <div className="flex flex-wrap gap-2">
            {isBooked && rental.canPickup && (
              <Button className="flex-1" onClick={openPickup}>
                <Package className="h-4 w-4" />
                Complete pickup
              </Button>
            )}
            {isBooked && (
              <Button variant="outline" onClick={openReschedule}>
                <CalendarClock className="h-4 w-4" />
                Change dates
              </Button>
            )}
            {isBooked && (
              <Button
                variant="outline"
                onClick={openCancel}
                disabled={cancelMutation.isPending}
              >
                Cancel
              </Button>
            )}
            {isOut && (
              <>
                <Button variant="outline" className="flex-1" onClick={openExtend}>
                  <Calendar className="h-4 w-4" />
                  Extend
                </Button>
                <WhatsAppButton phone={rental.customer.phone} message={billMsg} label="Bill" />
                <WhatsAppButton phone={rental.customer.phone} message={reminderMsg} label="Remind" />
              </>
            )}
            {isBooked && (
              <WhatsAppButton phone={rental.customer.phone} message={billMsg} label="Confirm" />
            )}
          </div>
        )}

        {rental.extensions.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3">Extensions</p>
            <div className="space-y-2">
              {rental.extensions.map((ext) => (
                <div
                  key={ext.id}
                  className="text-sm text-muted bg-card border border-border rounded-xl px-4 py-3 border-l-2 border-l-border"
                >
                  {formatDate(ext.previousDueDate)} → {formatDate(ext.newDueDate)}
                  {ext.amount != null && ext.amount > 0 && (
                    <span className="text-ink font-medium"> · {formatINR(ext.amount)}</span>
                  )}
                  {ext.reason && <span className="text-muted"> · {ext.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-3">Payments</p>
          <div className="space-y-2">
            {rental.payments.length === 0 && (
              <p className="text-sm text-muted">No payments recorded yet</p>
            )}
            {rental.payments.map((p) => {
              // Refunds (deposit refund, or a negative rent refund) are money out.
              const isRefund = p.type === 'DEPOSIT_REFUND' || p.amount < 0
              return (
                <div
                  key={p.id}
                  className="flex justify-between items-center text-sm bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium capitalize">{p.type.replace(/_/g, ' ').toLowerCase()}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {p.method.replace(/_/g, ' ')} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`font-display font-semibold ${isRefund ? 'text-red-600' : 'text-green-700'}`}
                  >
                    {isRefund ? '−' : '+'}
                    {formatINR(Math.abs(p.amount))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {isOut && (
        <div className="fixed bottom-[88px] inset-x-4 z-30 md:hidden">
          <Link href={`/rentals/${id}/return`}>
            <Button className="w-full" size="lg">
              Process Return
            </Button>
          </Link>
        </div>
      )}

      {showPickup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setShowPickup(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm md:max-w-md shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="font-semibold">Complete pickup</h3>
            {(rental.amountDueOnPickup ?? 0) > 0 ? (
              <>
                <p className="text-sm text-muted">Collect from customer (edit if collecting less):</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted">Rent (due {formatINR(rental.rentalDue ?? 0)})</p>
                    <Input
                      type="number"
                      min="0"
                      max={rental.rentalDue ?? 0}
                      value={pickupRent}
                      onChange={(e) => setPickupRent(e.target.value)}
                      disabled={(rental.rentalDue ?? 0) === 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted">Deposit (due {formatINR(rental.depositDue ?? 0)})</p>
                    <Input
                      type="number"
                      min="0"
                      max={rental.depositDue ?? 0}
                      value={pickupDeposit}
                      onChange={(e) => setPickupDeposit(e.target.value)}
                      disabled={(rental.depositDue ?? 0) === 0}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Payment method</Label>
                  <Select value={pickupMethod} onChange={(e) => setPickupMethod(e.target.value as PaymentMethod)}>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </Select>
                </div>
                {(Number(pickupDeposit) || 0) < (rental.depositDue ?? 0) && (
                  <p className="text-xs text-amber-700">
                    The full deposit ({formatINR(rental.depositDue ?? 0)}) must be collected before handover.
                  </p>
                )}
                {(rental.rentalDue ?? 0) - (Number(pickupRent) || 0) > 0 && (
                  <p className="text-xs text-muted">
                    Rent balance of {formatINR((rental.rentalDue ?? 0) - (Number(pickupRent) || 0))} will be
                    collected at return.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">All payments collected. Mark ornaments as picked up?</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPickup(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={
                  pickupMutation.isPending ||
                  (Number(pickupDeposit) || 0) < (rental.depositDue ?? 0)
                }
                onClick={() => pickupMutation.mutate()}
              >
                {pickupMutation.isPending ? 'Processing…' : 'Confirm pickup'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReschedule && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setShowReschedule(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm md:max-w-md shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="font-semibold">Change booking dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Pickup date</Label>
                <Input
                  type="date"
                  value={newStart}
                  onChange={(e) => applyDates(e.target.value, newDue < e.target.value ? e.target.value : newDue)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Return date</Label>
                <Input
                  type="date"
                  value={newDue}
                  min={newStart}
                  onChange={(e) => applyDates(newStart, e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              {rescheduleDays} day{rescheduleDays !== 1 ? 's' : ''} rental duration
            </p>
            <div className="space-y-1.5">
              <Label>Rental total (₹)</Label>
              <Input
                type="number"
                min={0}
                value={newTotal}
                onChange={(e) => setNewTotal(e.target.value)}
              />
              <p className="text-xs text-muted">Auto-calculated from the new dates — edit if needed.</p>
            </div>
            {rescheduleError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{rescheduleError}</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowReschedule(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!newStart || !newDue || newDue < newStart || rescheduleMutation.isPending}
                onClick={() => { setRescheduleError(''); rescheduleMutation.mutate() }}
              >
                {rescheduleMutation.isPending ? 'Saving...' : 'Save dates'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showExtend && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setShowExtend(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm md:max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="font-semibold">Extend Rental</h3>

            <p className="text-sm text-muted">
              Current return:{' '}
              <span className="font-medium text-ink">{formatDate(rental.dueDate)}</span>
            </p>

            <div className="space-y-1.5">
              <Label>Extra days</Label>
              <Input
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
              />
              <p className="text-xs text-muted">
                New return: {formatDate(addDaysTo(rental.dueDate, extDays))}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Price per day (₹)</Label>
              <Input
                type="number"
                min={0}
                value={extendRate}
                onChange={(e) => setExtendRate(e.target.value)}
              />
              <p className="text-xs text-muted">Defaults to the items' daily rate — edit if needed.</p>
            </div>

            <div className="flex justify-between items-center rounded-xl bg-surface px-3 py-2.5">
              <span className="text-sm text-muted">
                Extra charge ({extDays} day{extDays !== 1 ? 's' : ''})
              </span>
              <span className="font-display font-semibold text-base">{formatINR(extAmount)}</span>
            </div>
            {(rental.rentalPaid ?? 0) > 0 && (
              <p className="text-xs text-muted -mt-2">
                Already paid on this rental: {formatINR(rental.rentalPaid ?? 0)}
              </p>
            )}

            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={extendPaid}
                onChange={(e) => setExtendPaid(e.target.checked)}
                className="h-4 w-4 accent-ink"
              />
              Paid now
            </label>
            {extendPaid ? (
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select
                  value={extendMethod}
                  onChange={(e) => setExtendMethod(e.target.value as PaymentMethod)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </Select>
              </div>
            ) : (
              extAmount > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  Added to the rental balance — collect at return.
                </p>
              )
            )}

            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowExtend(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={extDays < 1 || extendMutation.isPending}
                onClick={() => extendMutation.mutate()}
              >
                {extendMutation.isPending ? 'Saving...' : 'Extend'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setShowCancel(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm md:max-w-md shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="font-semibold">Cancel this booking?</h3>
            <p className="text-sm text-muted">
              The reserved ornaments will be freed for other customers. This cannot be undone.
            </p>
            {((rental.rentalPaid ?? 0) > 0 || (rental.depositPaid ?? 0) > 0) && (
              <>
                <p className="text-sm font-medium text-ink">Refund to customer</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted">Rent (paid {formatINR(rental.rentalPaid ?? 0)})</p>
                    <Input
                      type="number"
                      min="0"
                      max={rental.rentalPaid ?? 0}
                      value={cancelRentRefund}
                      onChange={(e) => setCancelRentRefund(e.target.value)}
                      disabled={(rental.rentalPaid ?? 0) === 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted">Deposit (paid {formatINR(rental.depositPaid ?? 0)})</p>
                    <Input
                      type="number"
                      min="0"
                      max={rental.depositPaid ?? 0}
                      value={cancelDepositRefund}
                      onChange={(e) => setCancelDepositRefund(e.target.value)}
                      disabled={(rental.depositPaid ?? 0) === 0}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Refund method</Label>
                  <Select value={cancelMethod} onChange={(e) => setCancelMethod(e.target.value as PaymentMethod)}>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </Select>
                </div>
                {(rental.depositPaid ?? 0) - (Number(cancelDepositRefund) || 0) > 0 && (
                  <p className="text-xs text-muted">
                    Keeping {formatINR((rental.depositPaid ?? 0) - (Number(cancelDepositRefund) || 0))} of the
                    deposit as a cancellation fee.
                  </p>
                )}
              </>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancel(false)}
                disabled={cancelMutation.isPending}
              >
                Keep booking
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel booking'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
