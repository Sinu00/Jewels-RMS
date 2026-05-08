'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatDate } from '@/lib/formatters'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')

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

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    clearTimeout((window as any)._searchTimeout2)
    ;(window as any)._searchTimeout2 = setTimeout(() => setDebouncedSearch(e.target.value), 350)
  }

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

      {/* Status tabs */}
      <div className="px-4 md:px-6 mb-3">
        <div className="flex gap-1 border-b border-border">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={cn(
                'px-3 py-2 text-sm transition-colors relative shrink-0',
                status === key
                  ? 'text-ink font-medium'
                  : 'text-muted hover:text-ink'
              )}
            >
              {label}
              {status === key && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gold rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 md:px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <Input
            placeholder="Search by customer name or rental number…"
            className="pl-9"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
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
        <div className="px-4 md:px-6">
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {data?.data.map((rental) => (
              <Link key={rental.id} href={`/rentals/${rental.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 bg-card card-interactive">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="item-code">{rental.rentalNumber}</span>
                      <StatusBadge status={rental.status} />
                      {rental.daysOverdue > 0 && (
                        <span className="text-xs font-medium text-red-600">
                          {rental.daysOverdue}d overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-ink mt-0.5 truncate">
                      {rental.customerName}
                    </p>
                    <p className="text-xs text-muted">
                      {rental.itemsCount} item{rental.itemsCount !== 1 ? 's' : ''} · Due {formatDate(rental.dueDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <RupeeAmount amount={rental.totalRentalAmount} size="md" />
                    <p className="text-xs text-muted mt-0.5">
                      + <RupeeAmount amount={rental.depositAmount} size="sm" className="text-muted" /> dep.
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
