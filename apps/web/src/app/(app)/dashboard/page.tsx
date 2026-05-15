'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Plus, ArrowRight, LogOut, Bell, Settings } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate, formatDateInput, whatsappUrl, buildReminderMessage } from '@/lib/formatters'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { OrnamentCard } from '@/components/shared/OrnamentCard'
import type { DashboardStats } from '@rental/types'

function getTodayStr() {
  return formatDateInput(new Date())
}

function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatDateInput(d)
}

export default function DashboardPage() {
  const { user, clearAuth, isAdmin } = useAuthStore()
  const todayStr = getTodayStr()
  const tomorrowStr = getTomorrowStr()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: keys.dashboard(),
    queryFn: async () => (await api.get('/dashboard')).data,
    refetchInterval: 60000,
  })

  const { data: dueSoonData } = useQuery({
    queryKey: keys.rentals({ dueSoon: true, today: todayStr }),
    queryFn: async () => {
      const [todayRes, tomorrowRes] = await Promise.all([
        api.get(`/rentals?dueDate=${todayStr}&limit=10`),
        api.get(`/rentals?dueDate=${tomorrowStr}&limit=10`),
      ])
      const combined = [
        ...(todayRes.data.data as any[]),
        ...(tomorrowRes.data.data as any[]),
      ].filter((r: any) => r.status !== 'RETURNED')
      return combined
    },
  })

  const { data: availableData } = useQuery({
    queryKey: keys.ornaments({ available: true, limit: 12 }),
    queryFn: async () => (await api.get('/ornaments?available=true&limit=12')).data,
  })

  if (isLoading) return <LoadingSpinner />

  const overdue = stats?.overdueRentals ?? 0
  const active = stats?.totalActiveRentals ?? 0
  const dueToday = stats?.dueTodayRentals ?? 0
  const todayIncome = stats?.todayIncome ?? 0
  const available = stats?.availableOrnaments ?? 0
  const total = stats?.totalOrnaments ?? 0
  const dueSoon: any[] = dueSoonData ?? []
  const availableOrnaments: any[] = availableData?.data ?? []

  return (
    <div className="max-w-2xl px-5 py-8 md:px-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-muted font-medium mb-1">Good day</p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight leading-tight">{user?.outletName}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/rentals/new" className="hidden md:block mr-1">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Rental
            </Button>
          </Link>
          <Link href="/notifications">
            <button className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-ink hover:bg-border transition-colors" title="Notifications">
              <Bell className="h-4 w-4" />
            </button>
          </Link>
          {isAdmin() && (
            <Link href="/settings">
              <button className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-ink hover:bg-border transition-colors" title="Settings">
                <Settings className="h-4 w-4" />
              </button>
            </Link>
          )}
          <button
            onClick={clearAuth}
            className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-ink hover:bg-border transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCell label="Active rentals" value={active} />
        <StatCell label="Due today" value={dueToday} highlight={dueToday > 0} />
        <StatCell label="Today's income" value={<RupeeAmount amount={todayIncome} size="lg" />} />
        <StatCell label="Available" value={`${available} / ${total}`} sub="ornaments" />
      </div>

      {/* Overdue */}
      {overdue > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot--overdue" />
              <h2 className="text-base font-semibold text-ink">
                {overdue} overdue rental{overdue !== 1 ? 's' : ''}
              </h2>
            </div>
            <Link href="/rentals?status=OVERDUE">
              <span className="text-xs text-muted hover:text-ink flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {stats?.overdueList.map((item) => {
              const reminderMsg = buildReminderMessage({
                rentalNumber: item.rentalNumber,
                customer: { name: item.customerName },
                items: item.itemNames.map((n) => ({ ornament: { name: n } })),
                dueDate: item.dueDate,
                daysOverdue: item.daysOverdue,
              })
              return (
                <div key={item.rentalId} className="flex items-center gap-3 px-4 py-3.5 bg-card card-interactive">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link href={`/rentals/${item.rentalId}`} className="item-code hover:underline">
                        {item.rentalNumber}
                      </Link>
                      <span className="text-xs font-medium text-red-500">
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
                    <button className="h-9 w-9 rounded-xl border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </a>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {overdue === 0 && active > 0 && (
        <div className="mb-8 flex items-center gap-2 text-sm text-muted bg-card rounded-2xl border border-border px-4 py-3">
          <span className="status-dot status-dot--available" />
          All caught up — no overdue rentals
        </div>
      )}


      {/* Due for return carousel */}
      {dueSoon.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink">Due for return</h2>
            <Link href="/rentals?status=ACTIVE">
              <span className="text-xs text-muted hover:text-ink flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-5 px-5 pr-5 md:-mx-6 md:px-6 md:pr-6">
            {dueSoon.map((r: any) => {
              const isToday = r.dueDate.startsWith(todayStr)
              return (
                <Link
                  key={r.id}
                  href={`/rentals/${r.id}`}
                  className="shrink-0 snap-start w-44 bg-card border border-border rounded-2xl p-3.5 hover:border-ink transition-colors"
                >
                  <p className="text-xs font-mono text-muted mb-1 truncate">{r.rentalNumber}</p>
                  <p className="text-sm font-semibold text-ink truncate">{r.customerName}</p>
                  <p className="text-xs text-muted mt-1">{r.itemsCount} item{r.itemsCount !== 1 ? 's' : ''}</p>
                  <p className={`text-xs font-medium mt-2 ${isToday ? 'text-amber-600' : 'text-muted'}`}>
                    {isToday ? 'Due today' : `Due ${formatDate(r.dueDate)}`}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Available now carousel */}
      {availableOrnaments.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink">Available now</h2>
            <Link href="/inventory?available=true">
              <span className="text-xs text-muted hover:text-ink flex items-center gap-1 transition-colors">
                Browse all <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-5 px-5 pr-5 md:-mx-6 md:px-6 md:pr-6">
            {availableOrnaments.map((o: any) => (
              <div key={o.id} className="shrink-0 snap-start w-36">
                <OrnamentCard ornament={o} />
              </div>
            ))}
          </div>
        </section>
      )}
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
    <div className={`rounded-2xl border px-4 py-4 ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-card border-border'}`}>
      <p className="text-xs text-muted mb-2">{label}</p>
      <p className={`text-2xl font-display font-semibold tracking-tight ${highlight ? 'text-amber-700' : 'text-ink'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}
