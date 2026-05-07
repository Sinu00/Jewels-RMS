'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft, MessageCircle, Calendar, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate, buildBillMessage, buildReminderMessage, whatsappUrl } from '@/lib/formatters'
import { useAuthStore } from '@/stores/authStore'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { WhatsAppButton } from '@/components/shared/WhatsAppButton'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Rental } from '@rental/types'

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [showExtend, setShowExtend] = useState(false)
  const [newDueDate, setNewDueDate] = useState('')
  const [reason, setReason] = useState('')

  const { data: rental, isLoading } = useQuery<Rental>({
    queryKey: keys.rental(id),
    queryFn: async () => (await api.get(`/rentals/${id}`)).data,
  })

  const extendMutation = useMutation({
    mutationFn: () => api.post(`/rentals/${id}/extend`, { newDueDate, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rental(id) })
      queryClient.invalidateQueries({ queryKey: keys.rentals() })
      setShowExtend(false)
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (!rental) return <div className="p-6 text-muted">Rental not found</div>

  const outletName = user?.outletName ?? 'Our Shop'
  const billMsg = buildBillMessage(rental, outletName)
  const reminderMsg = buildReminderMessage(rental)
  const canAct = rental.status !== 'RETURNED'

  return (
    <div>
      <PageHeader
        title={rental.rentalNumber}
        action={<Link href="/rentals"><Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" />Back</Button></Link>}
      />

      <div className="px-4 md:px-6 max-w-2xl space-y-4 pb-8">
        {/* Status bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={rental.status} />
          {rental.daysOverdue > 0 && (
            <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />{rental.daysOverdue} days overdue
            </span>
          )}
        </div>

        {/* Customer + dates */}
        <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted text-xs">Customer</p>
            <Link href={`/customers/${rental.customerId}`} className="font-medium hover:text-gold">{rental.customer.name}</Link>
            <p className="text-muted text-xs">{rental.customer.phone}</p>
          </div>
          <div>
            <p className="text-muted text-xs">Start / Due</p>
            <p className="font-medium">{formatDate(rental.startDate)}</p>
            <p className="font-medium">{formatDate(rental.dueDate)}</p>
          </div>
          {rental.returnedAt && (
            <div>
              <p className="text-muted text-xs">Returned</p>
              <p className="font-medium">{formatDate(rental.returnedAt)}</p>
            </div>
          )}
          {rental.notes && (
            <div className="col-span-2">
              <p className="text-muted text-xs">Notes</p>
              <p className="text-ink">{rental.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <p className="text-sm font-semibold mb-2">Items</p>
          <div className="space-y-2">
            {rental.items.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.ornament.name}</p>
                  <p className="text-xs text-muted">{item.ornament.itemCode} · {formatINR(item.ratePerDay)}/day</p>
                </div>
                <p className="font-display font-semibold">{formatINR(item.totalAmount)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-2 px-3">
            <span className="text-sm text-muted">Rental Total</span>
            <RupeeAmount amount={rental.totalRentalAmount} size="md" />
          </div>
        </div>

        {/* Deposit */}
        <div className={`rounded-xl p-4 ${rental.status !== 'RETURNED' ? 'bg-gold/5 border border-gold/20' : 'bg-card border border-border'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">Security Deposit</p>
              <p className="text-xs text-muted">{rental.depositRefunded ? 'Refunded' : 'Held'}</p>
            </div>
            <RupeeAmount amount={rental.depositAmount} size="lg" className={rental.depositRefunded ? 'text-muted line-through' : 'text-gold'} />
          </div>
        </div>

        {/* Actions */}
        {canAct && (
          <div className="flex gap-2 flex-wrap">
            <Link href={`/rentals/${id}/return`}>
              <Button>Process Return</Button>
            </Link>
            <Button variant="outline" onClick={() => setShowExtend(true)}>
              <Calendar className="h-4 w-4" />Extend
            </Button>
            <WhatsAppButton phone={rental.customer.phone} message={billMsg} label="Send Bill" />
            <WhatsAppButton phone={rental.customer.phone} message={reminderMsg} label="Reminder" />
          </div>
        )}

        {/* Extensions */}
        {rental.extensions.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Extensions</p>
            {rental.extensions.map((ext) => (
              <div key={ext.id} className="text-sm text-muted border-l-2 border-gold/30 pl-3 mb-2">
                {formatDate(ext.previousDueDate)} → {formatDate(ext.newDueDate)}
                {ext.reason && <span> · {ext.reason}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Payments */}
        <div>
          <p className="text-sm font-semibold mb-2">Payments</p>
          <div className="space-y-2">
            {rental.payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm bg-card border border-border rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium capitalize">{p.type.replace(/_/g, ' ').toLowerCase()}</p>
                  <p className="text-xs text-muted">{p.method.replace(/_/g, ' ')} · {formatDate(p.createdAt)}</p>
                </div>
                <span className={`font-display font-semibold ${p.type === 'DEPOSIT_REFUND' ? 'text-red-600' : 'text-green-700'}`}>
                  {p.type === 'DEPOSIT_REFUND' ? '-' : '+'}{formatINR(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Extend dialog */}
      {showExtend && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowExtend(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold">Extend Rental</h3>
            <div className="space-y-1.5">
              <Label>New Due Date</Label>
              <Input type="date" value={newDueDate} min={rental.dueDate as string} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer requested extension" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowExtend(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!newDueDate || extendMutation.isPending} onClick={() => extendMutation.mutate()}>
                {extendMutation.isPending ? 'Saving...' : 'Extend'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
