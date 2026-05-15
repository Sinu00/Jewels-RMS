'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatDate } from '@/lib/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function NotificationsPage() {
  const tomorrow = getTomorrow()

  const { data: activeData, isLoading: loadingActive } = useQuery({
    queryKey: keys.rentals({ dueDate: tomorrow, status: 'ACTIVE' }),
    queryFn: async () => (await api.get(`/rentals?dueDate=${tomorrow}&status=ACTIVE&limit=50`)).data,
  })

  const { data: extendedData, isLoading: loadingExtended } = useQuery({
    queryKey: keys.rentals({ dueDate: tomorrow, status: 'EXTENDED' }),
    queryFn: async () => (await api.get(`/rentals?dueDate=${tomorrow}&status=EXTENDED&limit=50`)).data,
  })

  const isLoading = loadingActive || loadingExtended
  const dueTomorrow: any[] = [
    ...(activeData?.data ?? []),
    ...(extendedData?.data ?? []),
  ]

  return (
    <div>
      <PageHeader title="Notifications" />

      <div className="px-5 md:px-6 pb-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : dueTomorrow.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-10 w-10 text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted">No returns due tomorrow</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted mb-4">
              {dueTomorrow.length} rental{dueTomorrow.length !== 1 ? 's' : ''} due tomorrow ({formatDate(tomorrow)})
            </p>
            {dueTomorrow.map((r: any) => (
              <Link key={r.id} href={`/rentals/${r.id}`}>
                <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-start gap-3 hover:border-ink transition-colors">
                  <div className="mt-0.5 h-8 w-8 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Return due tomorrow</p>
                    <p className="text-sm text-muted mt-0.5">{r.customerName}</p>
                    <p className="text-xs text-muted mt-0.5 font-mono">{r.rentalNumber}</p>
                    <p className="text-xs text-muted mt-1">View rental →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
