'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, UserPlus, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Customer, PaginatedResponse } from '@rental/types'

export function Step1Customer() {
  const { customer, setCustomer, setStep, isNewCustomer, setIsNewCustomer, newCustomerData, setNewCustomerData } = useRentalWizardStore()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data } = useQuery<PaginatedResponse<Customer>>({
    queryKey: keys.customers({ search: debouncedSearch }),
    queryFn: async () => (await api.get(`/customers?search=${debouncedSearch}&limit=10`)).data,
    enabled: debouncedSearch.length > 0,
  })

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setSearch(v)
    clearTimeout((window as any)._s1Timeout)
    ;(window as any)._s1Timeout = setTimeout(() => setDebouncedSearch(v), 300)
  }

  function selectCustomer(c: Customer) {
    setCustomer(c)
    setIsNewCustomer(false)
  }

  function canProceed() {
    if (isNewCustomer) return newCustomerData.name && newCustomerData.phone
    return customer !== null
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink">Select Customer</h2>

      {/* Search existing */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <Input
          placeholder="Search by name or phone..."
          className="pl-9"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Results */}
      {data?.data.length === 0 && debouncedSearch && (
        <p className="text-sm text-muted text-center py-3">No customers found</p>
      )}
      {data?.data && data.data.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {data.data.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCustomer(c)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${customer?.id === c.id ? 'border-gold bg-gold/5' : 'border-border bg-card hover:bg-bg'}`}
            >
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted">{c.phone}</p>
              </div>
              {customer?.id === c.id && <Check className="h-4 w-4 text-gold" />}
            </button>
          ))}
        </div>
      )}

      {/* Selected customer display when no search */}
      {customer && !debouncedSearch && !isNewCustomer && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gold bg-gold/5">
          <div>
            <p className="font-medium text-sm">{customer.name}</p>
            <p className="text-xs text-muted">{customer.phone}</p>
          </div>
          <Check className="h-4 w-4 text-gold" />
        </div>
      )}

      {/* New customer form */}
      <div>
        <button
          type="button"
          onClick={() => { setIsNewCustomer(!isNewCustomer); setCustomer(null) }}
          className="flex items-center gap-2 text-sm text-gold font-medium"
        >
          <UserPlus className="h-4 w-4" />
          {isNewCustomer ? 'Cancel — search existing instead' : 'Create new customer'}
        </button>

        {isNewCustomer && (
          <div className="mt-3 space-y-3 bg-card border border-border rounded-xl p-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                placeholder="Customer name"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData({ name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                placeholder="10-digit number"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                placeholder="Optional"
                value={newCustomerData.address}
                onChange={(e) => setNewCustomerData({ address: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={() => setStep(2)} disabled={!canProceed()} size="lg">
          Next: Select Ornaments
        </Button>
      </div>
    </div>
  )
}
