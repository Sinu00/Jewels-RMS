'use client'

import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery, useMutation } from '@tanstack/react-query'
import { UserPlus, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchInput } from '@/components/shared/SearchInput'
import type { Customer, PaginatedResponse } from '@rental/types'

export function Step1Customer() {
  const { customer, setCustomer, setStep, isNewCustomer, setIsNewCustomer, newCustomerData, setNewCustomerData } = useRentalWizardStore()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const { data } = useQuery<PaginatedResponse<Customer>>({
    queryKey: keys.customers({ search: debouncedSearch }),
    queryFn: async () => (await api.get(`/customers?search=${debouncedSearch}&limit=10`)).data,
    enabled: debouncedSearch.length > 0,
  })

  function selectCustomer(c: Customer) {
    setCustomer(c)
    setIsNewCustomer(false)
  }

  function canProceed() {
    if (isNewCustomer) return newCustomerData.name && newCustomerData.phone
    return customer !== null
  }

  function clearSearch() {
    setSearch('')
  }

  return (
    <div className="space-y-4">
      {/* Search existing */}
      <SearchInput
        placeholder="Search by name or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={search ? clearSearch : undefined}
      />

      {/* Results */}
      {data?.data.length === 0 && debouncedSearch && search && (
        <p className="text-sm text-muted text-center py-4">No customers found for "{debouncedSearch}"</p>
      )}
      {data?.data && data.data.length > 0 && debouncedSearch && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {data.data.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCustomer(c)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all ${
                customer?.id === c.id
                  ? 'border-ink bg-surface shadow-sm'
                  : 'border-border bg-card hover:bg-surface'
              }`}
            >
              <div>
                <p className="font-semibold text-sm text-ink">{c.name}</p>
                <p className="text-xs text-muted mt-0.5">{c.phone}</p>
              </div>
              {customer?.id === c.id && (
                <div className="h-6 w-6 rounded-full bg-ink flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected customer display when no active search */}
      {customer && !debouncedSearch && !isNewCustomer && (
        <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-ink bg-surface">
          <div>
            <p className="font-semibold text-sm text-ink">{customer.name}</p>
            <p className="text-xs text-muted mt-0.5">{customer.phone}</p>
          </div>
          <div className="h-6 w-6 rounded-full bg-ink flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}

      {/* New customer form */}
      <div>
        <button
          type="button"
          onClick={() => { setIsNewCustomer(!isNewCustomer); setCustomer(null) }}
          className="flex items-center gap-2 text-sm font-medium text-ink py-1"
        >
          <UserPlus className="h-4 w-4" />
          {isNewCustomer ? 'Cancel — search existing instead' : 'Create new customer'}
        </button>

        {isNewCustomer && (
          <div className="mt-3 space-y-3 bg-card border border-border rounded-2xl p-4">
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
              <Label>Address <span className="text-muted font-normal">(optional)</span></Label>
              <Input
                placeholder="Street, city"
                value={newCustomerData.address}
                onChange={(e) => setNewCustomerData({ address: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <Button onClick={() => setStep(2)} disabled={!canProceed()} size="lg" className="w-full">
        Continue to Ornaments
      </Button>
    </div>
  )
}
