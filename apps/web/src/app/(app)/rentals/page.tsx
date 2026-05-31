'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatDate, formatDateInput } from '@/lib/formatters'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { SkeletonList } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import type { RentalSummary, RentalStatus, PaginatedResponse } from '@rental/types'
import { cn } from '@/lib/utils'

type TabKey = RentalStatus | 'OUT' | ''

const TABS: { key: TabKey; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'BOOKED', label: 'Bookings' },
  { key: 'OUT', label: 'Out' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'EXTENDED', label: 'Extended' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

type RentalView = 'out' | 'bookings' | 'pickups-today' | 'due-today' | 'overdue'

const VIEW_SUBTITLES: Record<RentalView, string> = {
  out: 'Items out with customers',
  bookings: 'All open pre-bookings',
  'pickups-today': 'Pickups scheduled for today',
  'due-today': 'Returns due today',
  overdue: 'Overdue rentals',
}

function tabFromView(view: RentalView | null): TabKey {
  switch (view) {
    case 'out':
    case 'due-today':
      return 'OUT'
    case 'bookings':
    case 'pickups-today':
      return 'BOOKED'
    case 'overdue':
      return 'OVERDUE'
    default:
      return ''
  }
}

function viewFromTab(tab: TabKey): RentalView | null {
  switch (tab) {
    case 'OUT':
      return 'out'
    case 'BOOKED':
      return 'bookings'
    case 'OVERDUE':
      return 'overdue'
    default:
      return null
  }
}

export default function RentalsPage() {
  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view') as RentalView | null
  const validView =
    viewParam && ['out', 'bookings', 'pickups-today', 'due-today', 'overdue'].includes(viewParam)
      ? viewParam
      : null

  const [tab, setTab] = useState<TabKey>(() => tabFromView(validView))
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(50)
  const debouncedSearch = useDebounce(search)

  useEffect(() => {
    if (validView) setTab(tabFromView(validView))
  }, [validView])

  // Reset paging whenever the filter set changes.
  useEffect(() => {
    setLimit(50)
  }, [tab, debouncedSearch, validView])

  const todayStr = formatDateInput(new Date())

  const queryConfig = useMemo(() => {
    const view = validView ?? viewFromTab(tab)
    const params: Record<string, string> = { limit: String(limit) }

    if (view === 'out') {
      params.outOnly = 'true'
    } else if (view === 'bookings') {
      params.status = 'BOOKED'
    } else if (view === 'pickups-today') {
      params.status = 'BOOKED'
      params.startDate = todayStr
    } else if (view === 'due-today') {
      params.outOnly = 'true'
      params.dueDate = todayStr
    } else if (view === 'overdue') {
      params.status = 'OVERDUE'
    } else if (tab === 'OUT') {
      params.outOnly = 'true'
    } else if (tab) {
      params.status = tab
    }

    return { view, params }
  }, [validView, tab, todayStr, limit])

  const filters = {
    view: queryConfig.view,
    tab,
    search: debouncedSearch || undefined,
    ...queryConfig.params,
  }

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<RentalSummary>>({
    queryKey: keys.rentals(filters),
    queryFn: async () => {
      const params = new URLSearchParams(queryConfig.params)
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await api.get(`/rentals?${params}`)
      return res.data
    },
  })

  const activeView = validView ?? viewFromTab(tab)
  const subtitle = activeView
    ? VIEW_SUBTITLES[activeView]
    : data
      ? `${data.total} rental${data.total !== 1 ? 's' : ''}`
      : undefined

  function handleTabChange(key: TabKey) {
    setTab(key)
    const url = new URL(window.location.href)
    const nextView = viewFromTab(key)
    if (nextView) {
      url.searchParams.set('view', nextView)
    } else {
      url.searchParams.delete('view')
    }
    window.history.replaceState(null, '', url.pathname + url.search)
  }

  return (
    <div>
      <PageHeader
        title="Rentals"
        subtitle={subtitle}
        action={
          <Link href="/rentals/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Book
            </Button>
          </Link>
        }
      />

      <div className="px-5 md:px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                tab === key
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-surface text-muted hover:text-ink border border-border'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 md:px-6 mb-5">
        <SearchInput
          placeholder="Search by customer name or rental number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={search ? () => setSearch('') : undefined}
        />
      </div>

      {isLoading ? (
        <SkeletonList rows={6} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No rentals found"
          description={search ? 'Try a different search.' : undefined}
          action={
            !search ? (
              <Link href="/rentals/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  New booking
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="px-5 md:px-6 space-y-2">
          {data?.data.map((rental) => (
            <Link key={rental.id} href={`/rentals/${rental.id}`}>
              <div
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border card-interactive ${
                  rental.daysOverdue > 0 ? 'bg-red-50 border-red-100' : 'bg-card border-border'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="item-code">{rental.rentalNumber}</span>
                    <StatusBadge status={rental.status} />
                  </div>
                  <p className="text-sm font-semibold text-ink mt-1 truncate">{rental.customerName}</p>
                  <p
                    className={`text-xs mt-0.5 ${rental.daysOverdue > 0 ? 'text-red-500 font-medium' : 'text-muted'}`}
                  >
                    {rental.itemsCount} item{rental.itemsCount !== 1 ? 's' : ''}
                    {rental.status === 'BOOKED'
                      ? ` · Pickup ${formatDate(rental.startDate)}`
                      : rental.daysOverdue > 0
                        ? ` · ${rental.daysOverdue}d overdue`
                        : ` · Due ${formatDate(rental.dueDate)}`}
                  </p>
                </div>
                <RupeeAmount amount={rental.totalRentalAmount} size="md" className="shrink-0" />
              </div>
            </Link>
          ))}

          {data && data.data.length < data.total && (
            <div className="pt-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => setLimit((l) => l + 50)}
              >
                {isFetching ? 'Loading…' : `Load more (${data.data.length} of ${data.total})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
