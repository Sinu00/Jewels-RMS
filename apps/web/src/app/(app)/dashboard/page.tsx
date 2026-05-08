'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Plus, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate, whatsappUrl, buildReminderMessage } from '@/lib/formatters'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import type { DashboardStats } from '@rental/types'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: keys.dashboard(),
    queryFn: async () => (await api.get('/dashboard')).data,
    refetchInterval: 60000,
  })

  if (isLoading) return <LoadingSpinner />

  const overdue = stats?.overdueRentals ?? 0
  const active = stats?.totalActiveRentals ?? 0
  const dueToday = stats?.dueTodayRentals ?? 0
  const todayIncome = stats?.todayIncome ?? 0
  const available = stats?.availableOrnaments ?? 0
  const total = stats?.totalOrnaments ?? 0

  return (
    <div className="max-w-2xl px-4 py-6 md:px-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-ink">{user?.outletName}</h1>
          <p className="text-sm text-muted mt-0.5">Today's overview</p>
        </div>
        <Link href="/rentals/new" className="hidden md:block">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Rental
          </Button>
        </Link>
      </div>

      {/* Stat strip — scan in 2 seconds */}
      <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border mb-6">
        <StatCell
          label="Active rentals"
          value={active}
        />
        <StatCell
          label="Due today"
          value={dueToday}
          highlight={dueToday > 0}
        />
        <StatCell
          label="Today's income"
          value={<RupeeAmount amount={todayIncome} size="lg" />}
        />
        <StatCell
          label="Available"
          value={`${available} of ${total}`}
          sub="ornaments"
        />
      </div>

      {/* Overdue — the urgent section */}
      {overdue > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot--overdue" />
              <h2 className="text-sm font-semibold text-ink">
                {overdue} overdue rental{overdue !== 1 ? 's' : ''}
              </h2>
            </div>
            <Link href="/rentals?status=OVERDUE">
              <span className="text-xs text-muted hover:text-gold flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {stats?.overdueList.map((item) => {
              const reminderMsg = buildReminderMessage({
                rentalNumber: item.rentalNumber,
                customer: { name: item.customerName },
                items: item.itemNames.map((n) => ({ ornament: { name: n } })),
                dueDate: item.dueDate,
                daysOverdue: item.daysOverdue,
              })
              return (
                <div key={item.rentalId} className="flex items-center gap-3 px-4 py-3 bg-card card-interactive">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/rentals/${item.rentalId}`}
                        className="item-code hover:underline"
                      >
                        {item.rentalNumber}
                      </Link>
                      <span className="text-xs font-medium text-red-600">
                        {item.daysOverdue}d overdue
                      </span>
                    </div>
                    <p className="text-sm text-ink font-medium mt-0.5 truncate">{item.customerName}</p>
                    <p className="text-xs text-muted truncate">{item.itemNames.join(' · ')}</p>
                  </div>
                  <a
                    href={whatsappUrl(item.customerPhone, reminderMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                    aria-label="Send WhatsApp reminder"
                  >
                    <button className="h-9 w-9 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </a>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty overdue — calm confirmation */}
      {overdue === 0 && active > 0 && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted">
          <span className="status-dot status-dot--available" />
          No overdue rentals
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/rentals/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Rental
          </Button>
        </Link>
        <Link href="/inventory?available=true">
          <Button variant="outline" size="sm">
            Search Available Ornaments
          </Button>
        </Link>
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-card px-4 py-3 ${highlight ? 'bg-amber-50' : ''}`}>
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-xl font-display font-semibold ${highlight ? 'text-amber-700' : 'text-ink'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  )
}
