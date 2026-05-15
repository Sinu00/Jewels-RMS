'use client'

import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatDate } from '@/lib/formatters'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import type { RentalSummary, RentalStatus, PaginatedResponse } from '@rental/types'
import { cn } from '@/lib/utils'

const TABS: { key: RentalStatus | ''; label: string }[] = [
  { key: '',         label: 'All' },
  { key: 'ACTIVE',   label: 'Active' },
  { key: 'OVERDUE',  label: 'Overdue' },
  { key: 'EXTENDED', label: 'Extended' },
  { key: 'RETURNED', label: 'Returned' },
]

export default function RentalsPage() {
  const [status, setStatus] = useState<RentalStatus | ''>('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const filters = { status: status || undefined, search: debouncedSearch || undefined }
  const { data, isLoading } = useQuery<PaginatedResponse<RentalSummary>>({
    queryKey: keys.rentals(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('limit', '50')
      return (await api.get(`/rentals?${params}`)).data
    },
  })

  return (
    <div>
      <PageHeader
        title="Rentals"
        subtitle={data ? `${data.total} rental${data.total !== 1 ? 's' : ''}` : undefined}
        action={
          <Link href="/rentals/new">
            <Button size="sm"><Plus className="h-4 w-4" />New</Button>
          </Link>
        }
      />

      {/* Status filter chips */}
      <div className="px-5 md:px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                status === key
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-surface text-muted hover:text-ink border border-border'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 md:px-6 mb-5">
        <SearchInput
          placeholder="Search by customer name or rental number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={search ? () => setSearch('') : undefined}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No rentals found"
          description={search ? 'Try a different search.' : undefined}
          action={
            !search ? (
              <Link href="/rentals/new">
                <Button size="sm"><Plus className="h-4 w-4" />New Rental</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="px-5 md:px-6 space-y-2">
          {data?.data.map((rental) => (
            <Link key={rental.id} href={`/rentals/${rental.id}`}>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border card-interactive ${
                rental.daysOverdue > 0
                  ? 'bg-red-50 border-red-100'
                  : 'bg-card border-border'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="item-code">{rental.rentalNumber}</span>
                    <StatusBadge status={rental.status} />
                  </div>
                  <p className="text-sm font-semibold text-ink mt-1 truncate">{rental.customerName}</p>
                  <p className={`text-xs mt-0.5 ${rental.daysOverdue > 0 ? 'text-red-500 font-medium' : 'text-muted'}`}>
                    {rental.itemsCount} item{rental.itemsCount !== 1 ? 's' : ''}
                    {rental.daysOverdue > 0
                      ? ` · ${rental.daysOverdue}d overdue`
                      : ` · Due ${formatDate(rental.dueDate)}`}
                  </p>
                </div>
                <RupeeAmount amount={rental.totalRentalAmount} size="md" className="shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
