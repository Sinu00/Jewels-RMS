'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MessageCircle, Calendar, AlertTriangle, Phone } from 'lucide-react'
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
        back="/rentals"
        action={rental.daysOverdue > 0 ? (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5" />{rental.daysOverdue}d overdue
          </span>
        ) : undefined}
      />

      <div className="px-5 md:px-6 max-w-2xl space-y-4 pb-32 md:pb-8">
        {/* Status + customer row */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusBadge status={rental.status} />
              <Link href={`/customers/${rental.customerId}`} className="block mt-2 text-base font-semibold text-ink hover:text-muted transition-colors">
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
              <p className="text-xs text-muted">Rented on</p>
              <p className="font-medium mt-0.5">{formatDate(rental.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Due date</p>
              <p className={`font-medium mt-0.5 ${rental.daysOverdue > 0 ? 'text-red-600' : ''}`}>{formatDate(rental.dueDate)}</p>
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

        {/* Items */}
        <div>
          <p className="text-sm font-semibold mb-3">Items ({rental.items.length})</p>
          <div className="space-y-2">
            {rental.items.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.ornament.name}</p>
                  <p className="text-xs text-muted mt-0.5">{item.ornament.itemCode} · {formatINR(item.ratePerDay)}/day</p>
                </div>
                <p className="font-display font-semibold text-base">{formatINR(item.totalAmount)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="text-sm text-muted">Rental total</span>
            <RupeeAmount amount={rental.totalRentalAmount} size="md" />
          </div>
        </div>

        {/* Deposit */}
        <div className="rounded-2xl p-4 bg-card border border-border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">Security Deposit</p>
              <p className="text-xs text-muted mt-0.5">{rental.depositRefunded ? 'Refunded to customer' : 'Currently held'}</p>
            </div>
            <RupeeAmount amount={rental.depositAmount} size="lg" className={rental.depositRefunded ? 'text-muted line-through' : 'text-ink'} />
          </div>
        </div>

        {/* Secondary actions — always visible */}
        {canAct && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowExtend(true)}>
              <Calendar className="h-4 w-4" />Extend
            </Button>
            <WhatsAppButton phone={rental.customer.phone} message={billMsg} label="Bill" />
            <WhatsAppButton phone={rental.customer.phone} message={reminderMsg} label="Remind" />
          </div>
        )}

        {/* Extensions */}
        {rental.extensions.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3">Extensions</p>
            <div className="space-y-2">
              {rental.extensions.map((ext) => (
                <div key={ext.id} className="text-sm text-muted bg-card border border-border rounded-xl px-4 py-3 border-l-2 border-l-border">
                  {formatDate(ext.previousDueDate)} → {formatDate(ext.newDueDate)}
                  {ext.reason && <span className="text-muted"> · {ext.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments */}
        <div>
          <p className="text-sm font-semibold mb-3">Payments</p>
          <div className="space-y-2">
            {rental.payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm bg-card border border-border rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium capitalize">{p.type.replace(/_/g, ' ').toLowerCase()}</p>
                  <p className="text-xs text-muted mt-0.5">{p.method.replace(/_/g, ' ')} · {formatDate(p.createdAt)}</p>
                </div>
                <span className={`font-display font-semibold ${p.type === 'DEPOSIT_REFUND' ? 'text-red-600' : 'text-green-700'}`}>
                  {p.type === 'DEPOSIT_REFUND' ? '−' : '+'}{formatINR(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Process Return CTA — mobile */}
      {canAct && (
        <div className="fixed bottom-[88px] inset-x-4 z-30 md:hidden">
          <Link href={`/rentals/${id}/return`}>
            <Button className="w-full" size="lg">Process Return</Button>
          </Link>
        </div>
      )}

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
