'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Customer, PaginatedResponse } from '@rental/types'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [addError, setAddError] = useState('')

  const { data, isLoading } = useQuery<PaginatedResponse<Customer>>({
    queryKey: keys.customers({ search: debouncedSearch }),
    queryFn: async () => (await api.get(`/customers?search=${debouncedSearch}&limit=50`)).data,
  })

  const addMutation = useMutation({
    mutationFn: (body: object) => api.post('/customers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.customers() })
      setShowAdd(false)
      setForm({ name: '', phone: '', address: '' })
    },
    onError: (err: any) => setAddError(err.response?.data?.error ?? 'Failed'),
  })

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    clearTimeout((window as any)._custTimeout)
    ;(window as any)._custTimeout = setTimeout(() => setDebouncedSearch(e.target.value), 300)
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.total} total` : undefined}
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />Add
          </Button>
        }
      />

      <div className="px-5 md:px-6 mb-5">
        <SearchInput
          placeholder="Search by name or phone…"
          value={search}
          onChange={handleSearchChange}
          onClear={search ? () => { setSearch(''); setDebouncedSearch('') } : undefined}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : data?.data.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />Add Customer</Button>} />
      ) : (
        <div className="px-4 md:px-6 space-y-2">
          {data?.data.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div>
                  <p className="font-medium text-sm text-ink">{c.name}</p>
                  <p className="text-xs text-muted">{c.phone}</p>
                </div>
                {c.activeRentalsCount !== undefined && c.activeRentalsCount > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
                    {c.activeRentalsCount} active
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add customer sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold">Add Customer</h3>
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Optional" />
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="flex-1" disabled={addMutation.isPending || !form.name || !form.phone} onClick={() => addMutation.mutate({ name: form.name, phone: form.phone, address: form.address || undefined })}>
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
