'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatDate } from '@/lib/formatters'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Customer } from '@rental/types'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: customer, isLoading: loadingCustomer } = useQuery<Customer>({
    queryKey: keys.customer(id),
    queryFn: async () => (await api.get(`/customers/${id}`)).data,
  })

  const { data: rentals, isLoading: loadingRentals } = useQuery({
    queryKey: keys.customerRentals(id),
    queryFn: async () => (await api.get(`/customers/${id}/rentals?limit=20`)).data,
  })

  if (loadingCustomer) return <LoadingSpinner />
  if (!customer) return <div className="p-6 text-muted">Customer not found</div>

  return (
    <div>
      <PageHeader
        title={customer.name}
        action={<Link href="/customers"><Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" />Back</Button></Link>}
      />

      <div className="px-4 md:px-6 max-w-lg space-y-4 pb-8">
        {/* Info */}
        <div className="bg-card border border-border rounded-xl p-4 text-sm space-y-2">
          <div>
            <p className="text-xs text-muted">Phone</p>
            <p className="font-medium">{customer.phone}</p>
          </div>
          {customer.address && (
            <div>
              <p className="text-xs text-muted">Address</p>
              <p className="font-medium">{customer.address}</p>
            </div>
          )}
          {customer.idProofType && (
            <div>
              <p className="text-xs text-muted">ID Proof</p>
              <p className="font-medium">{customer.idProofType}: {customer.idProofNumber}</p>
            </div>
          )}
        </div>

        {/* Rental history */}
        <div>
          <p className="font-semibold text-sm mb-2">Rental History</p>
          {loadingRentals ? (
            <LoadingSpinner />
          ) : rentals?.data.length === 0 ? (
            <p className="text-sm text-muted">No rentals yet.</p>
          ) : (
            <div className="space-y-2">
              {rentals?.data.map((r: any) => (
                <Link key={r.id} href={`/rentals/${r.id}`}>
                  <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:shadow-sm">
                    <div>
                      <p className="font-mono text-xs text-gold">{r.rentalNumber}</p>
                      <p className="text-xs text-muted">{r.itemsCount} item{r.itemsCount !== 1 ? 's' : ''} · {formatDate(r.startDate)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
