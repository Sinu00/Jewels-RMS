'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate } from '@/lib/formatters'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import type { RentalSummary, RentalStatus, PaginatedResponse } from '@rental/types'
import { cn } from '@/lib/utils'

const TABS: { key: RentalStatus | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'OVERDUE', label: 'Overdue' },
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
        action={
          <Link href="/rentals/new">
            <Button size="sm"><Plus className="h-4 w-4" />New</Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="px-4 md:px-6 flex gap-1 overflow-x-auto pb-2 mb-3">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors',
              status === key
                ? 'bg-gold text-white font-medium'
                : 'text-muted hover:bg-card'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 md:px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input placeholder="Search by customer or rental number..." className="pl-9" value={search} onChange={handleSearchChange} />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No rentals found"
          action={<Link href="/rentals/new"><Button size="sm"><Plus className="h-4 w-4" />New Rental</Button></Link>}
        />
      ) : (
        <div className="px-4 md:px-6 space-y-2">
          {data?.data.map((rental) => (
            <Link key={rental.id} href={`/rentals/${rental.id}`}>
              <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gold font-medium">{rental.rentalNumber}</span>
                      <StatusBadge status={rental.status} />
                      {rental.daysOverdue > 0 && (
                        <span className="text-xs text-red-600 font-medium">{rental.daysOverdue}d overdue</span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-ink mt-0.5">{rental.customerName}</p>
                    <p className="text-xs text-muted">
                      {rental.itemsCount} item{rental.itemsCount !== 1 ? 's' : ''} · Due {formatDate(rental.dueDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-sm font-semibold">{formatINR(rental.totalRentalAmount)}</p>
                    <p className="text-xs text-muted">+ {formatINR(rental.depositAmount)} dep.</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
