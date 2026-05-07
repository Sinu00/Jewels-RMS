'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Package, ClipboardList, Clock, TrendingUp, MessageCircle, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate, whatsappUrl, buildReminderMessage } from '@/lib/formatters'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { DashboardStats } from '@rental/types'

function StatCard({ label, value, sub, icon: Icon, urgent }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  urgent?: boolean
}) {
  return (
    <Card className={urgent && Number(value) > 0 ? 'border-red-200 bg-red-50' : ''}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`rounded-xl p-2.5 ${urgent && Number(value) > 0 ? 'bg-red-100' : 'bg-gold/10'}`}>
          <Icon className={`h-5 w-5 ${urgent && Number(value) > 0 ? 'text-red-600' : 'text-gold'}`} />
        </div>
        <div>
          <p className="text-2xl font-display font-semibold text-ink">{value}</p>
          <p className="text-xs text-muted leading-tight">{label}</p>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: keys.dashboard(),
    queryFn: async () => (await api.get('/dashboard')).data,
    refetchInterval: 60000,
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="px-4 py-6 md:px-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-muted">{user?.outletName}</p>
        </div>
        <Link href="/rentals/new" className="hidden md:flex">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Rental
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 mb-6">
        <StatCard icon={ClipboardList} label="Active Rentals" value={stats?.totalActiveRentals ?? 0} />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdueRentals ?? 0} urgent />
        <StatCard icon={Clock} label="Due Today" value={stats?.dueTodayRentals ?? 0} />
        <StatCard icon={TrendingUp} label="Today's Income" value={formatINR(stats?.todayIncome ?? 0)} />
        <StatCard icon={Package} label="Available" value={`${stats?.availableOrnaments ?? 0}/${stats?.totalOrnaments ?? 0}`} sub="ornaments" />
      </div>

      {/* Overdue list */}
      {stats && stats.overdueList.length > 0 && (
        <div>
          <h2 className="font-semibold text-ink mb-3">Overdue Rentals</h2>
          <div className="space-y-3">
            {stats.overdueList.map((item) => {
              const reminderMsg = buildReminderMessage({
                rentalNumber: item.rentalNumber,
                customer: { name: item.customerName },
                items: item.itemNames.map((n) => ({ ornament: { name: n } })),
                dueDate: item.dueDate,
                daysOverdue: item.daysOverdue,
              })
              return (
                <Card key={item.rentalId} className="border-red-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/rentals/${item.rentalId}`} className="font-medium text-sm text-ink hover:text-gold">
                            {item.rentalNumber}
                          </Link>
                          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-medium">
                            {item.daysOverdue}d overdue
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-0.5">{item.customerName}</p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">{item.itemNames.join(', ')}</p>
                        <p className="text-xs text-muted">Due: {formatDate(item.dueDate)}</p>
                      </div>
                      <a
                        href={whatsappUrl(item.customerPhone, reminderMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="outline" size="sm" className="border-green-600 text-green-700 hover:bg-green-50">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 flex gap-3 flex-wrap">
        <Link href="/rentals/new">
          <Button><Plus className="h-4 w-4" />New Rental</Button>
        </Link>
        <Link href="/inventory">
          <Button variant="outline"><Package className="h-4 w-4" />Search Ornament</Button>
        </Link>
      </div>
    </div>
  )
}
