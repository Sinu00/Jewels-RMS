'use client'

import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { SkeletonList } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { toast } from '@/lib/toast'
import { sanitizePhone, isValidPhone } from '@/lib/formatters'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Customer, PaginatedResponse } from '@rental/types'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
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
      toast.success('Customer added')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'Failed to add customer'
      setAddError(msg)
      toast.error(msg)
    },
  })

  const phoneValid = isValidPhone(form.phone)

  function handleAdd() {
    if (!form.name || !phoneValid) return
    setAddError('')
    addMutation.mutate({ name: form.name, phone: form.phone, address: form.address || undefined })
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.total} total` : undefined}
        back="/dashboard"
        backMobileOnly
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
          onChange={(e) => setSearch(e.target.value)}
          onClear={search ? () => setSearch('') : undefined}
        />
      </div>

      {isLoading ? (
        <SkeletonList rows={8} />
      ) : data?.data.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />Add Customer</Button>} />
      ) : (
        <div className="px-4 md:px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setShowAdd(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm md:max-w-md shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="font-semibold">Add Customer</h3>
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhone(e.target.value) }))}
                placeholder="10-digit number"
              />
              {form.phone.length > 0 && !phoneValid && (
                <p className="text-xs text-red-600">Enter a valid 10-digit mobile number.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Optional" />
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="flex-1" disabled={addMutation.isPending || !form.name || !phoneValid} onClick={handleAdd}>
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
