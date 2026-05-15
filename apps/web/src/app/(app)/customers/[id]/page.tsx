'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { FileText, Phone, Plus } from 'lucide-react'
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
        back="/customers"
        action={
          <Link href={`/rentals/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4" />New Rental
            </Button>
          </Link>
        }
      />

      <div className="px-5 md:px-6 max-w-lg space-y-4 pb-8">
        {/* Info card */}
        <div className="bg-card border border-border rounded-2xl p-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Phone</p>
              <p className="font-medium mt-0.5">{customer.phone}</p>
            </div>
            <a
              href={`tel:${customer.phone}`}
              className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center"
            >
              <Phone className="h-4 w-4 text-muted" />
            </a>
          </div>
          {(customer.address || customer.idProofType) && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {customer.address && (
                <div>
                  <p className="text-xs text-muted">Address</p>
                  <p className="font-medium mt-0.5">{customer.address}</p>
                </div>
              )}
              {customer.idProofType && (
                <div>
                  <p className="text-xs text-muted">ID Proof</p>
                  <p className="font-medium mt-0.5">{customer.idProofType}: {customer.idProofNumber}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rental history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-base">Rental History</p>
            {rentals?.data.length > 0 && (
              <span className="text-xs text-muted">{rentals.data.length} rental{rentals.data.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          {loadingRentals ? (
            <LoadingSpinner />
          ) : rentals?.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <FileText className="h-8 w-8 text-muted/40 mx-auto mb-2" strokeWidth={1} />
              <p className="text-sm text-muted">No rentals yet</p>
              <Link href="/rentals/new" className="mt-3 inline-block">
                <Button size="sm"><Plus className="h-4 w-4" />Create first rental</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {rentals?.data.map((r: any) => (
                <Link key={r.id} href={`/rentals/${r.id}`}>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between card-interactive">
                    <div>
                      <p className="item-code">{r.rentalNumber}</p>
                      <p className="text-sm font-medium text-ink mt-0.5">{r.itemsCount} item{r.itemsCount !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-muted mt-0.5">{formatDate(r.startDate)}</p>
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
