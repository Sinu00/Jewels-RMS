'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Bell, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatDate, formatDateInput } from '@/lib/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatDateInput(d)
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

  const { data: overdueData, isLoading: loadingOverdue } = useQuery({
    queryKey: keys.rentals({ dueDate: tomorrow, status: 'OVERDUE' }),
    queryFn: async () => (await api.get(`/rentals?dueDate=${tomorrow}&status=OVERDUE&limit=50`)).data,
  })

  const { data: pickupData, isLoading: loadingPickup } = useQuery({
    queryKey: keys.rentals({ startDate: tomorrow, status: 'BOOKED' }),
    queryFn: async () => (await api.get(`/rentals?startDate=${tomorrow}&status=BOOKED&limit=50`)).data,
  })

  const isLoading = loadingActive || loadingExtended || loadingOverdue || loadingPickup
  const dueTomorrow: any[] = [
    ...(activeData?.data ?? []),
    ...(extendedData?.data ?? []),
    ...(overdueData?.data ?? []),
  ]
  const pickupTomorrow: any[] = pickupData?.data ?? []

  return (
    <div>
      <PageHeader title="Notifications" back="/dashboard" />

      <div className="px-5 md:px-6 pb-8 space-y-8 max-w-6xl mx-auto">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <section>
              <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Pickups tomorrow ({formatDate(tomorrow)})
              </h2>
              {pickupTomorrow.length === 0 ? (
                <p className="text-sm text-muted">No pickups scheduled for tomorrow</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {pickupTomorrow.map((r: any) => (
                    <Link key={r.id} href={`/rentals/${r.id}`}>
                      <div className="bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-ink transition-colors">
                        <p className="text-sm font-semibold text-ink">{r.customerName}</p>
                        <p className="text-xs text-muted font-mono mt-0.5">{r.rentalNumber}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Returns due tomorrow
              </h2>
              {dueTomorrow.length === 0 ? (
                <p className="text-sm text-muted">No returns due tomorrow</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {dueTomorrow.map((r: any) => (
                    <Link key={r.id} href={`/rentals/${r.id}`}>
                      <div className="bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-ink transition-colors">
                        <p className="text-sm font-semibold text-ink">{r.customerName}</p>
                        <p className="text-xs text-muted font-mono mt-0.5">{r.rentalNumber}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
