'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Plus } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR } from '@/lib/formatters'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Ornament, PaginatedResponse } from '@rental/types'

export function Step2Ornaments() {
  const { selectedItems, addItem, removeItem, setStep } = useRentalWizardStore()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')

  const { data: categories } = useQuery<string[]>({
    queryKey: keys.ornamentCategories(),
    queryFn: async () => (await api.get('/ornaments/categories')).data,
  })

  const { data, isLoading } = useQuery<PaginatedResponse<Ornament>>({
    queryKey: keys.ornaments({ search: debouncedSearch, category, available: 'true' }),
    queryFn: async () => {
      const params = new URLSearchParams({ available: 'true', limit: '40' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (category) params.set('category', category)
      return (await api.get(`/ornaments?${params}`)).data
    },
  })

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    clearTimeout((window as any)._s2Timeout)
    ;(window as any)._s2Timeout = setTimeout(() => setDebouncedSearch(e.target.value), 300)
  }

  const selectedIds = new Set(selectedItems.map((i) => i.ornamentId))

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink">Select Ornaments</h2>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input placeholder="Search ornaments..." className="pl-9" value={search} onChange={handleSearchChange} />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-36">
          <option value="">All</option>
          {categories?.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {/* Available ornaments */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {isLoading && <p className="text-sm text-muted col-span-full py-4 text-center">Loading...</p>}
        {data?.data.map((ornament) => {
          const isSelected = selectedIds.has(ornament.id)
          return (
            <button
              key={ornament.id}
              onClick={() => isSelected ? removeItem(ornament.id) : addItem(ornament, ornament.baseRatePerDay)}
              className={`flex flex-col rounded-xl border overflow-hidden text-left transition-all ${isSelected ? 'border-gold ring-2 ring-gold' : 'border-border hover:border-gold/50'}`}
            >
              <div className="aspect-square relative bg-bg">
                {ornament.images[0] ? (
                  <Image src={ornament.images[0].url} alt={ornament.name} fill className="object-cover" sizes="120px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">💍</div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-gold text-white flex items-center justify-center">
                      <X className="h-3.5 w-3.5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-mono text-muted">{ornament.itemCode}</p>
                <p className="text-xs font-medium leading-tight line-clamp-2">{ornament.name}</p>
                <p className="text-xs text-muted mt-0.5">{formatINR(ornament.baseRatePerDay)}/day</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected tray */}
      {selectedItems.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-gold mb-2">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</p>
          <div className="space-y-1.5">
            {selectedItems.map((item) => (
              <div key={item.ornamentId} className="flex items-center justify-between text-sm">
                <span className="text-ink line-clamp-1 flex-1">{item.ornament.name}</span>
                <button onClick={() => removeItem(item.ornamentId)} className="ml-2 text-muted hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
        <Button onClick={() => setStep(3)} disabled={selectedItems.length === 0} size="lg">
          Next: Set Dates
        </Button>
      </div>
    </div>
  )
}
