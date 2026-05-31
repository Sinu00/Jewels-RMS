'use client'

import { useState, useMemo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'
import { X, Check } from 'lucide-react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR } from '@/lib/formatters'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { SearchInput } from '@/components/shared/SearchInput'
import type { Ornament, PaginatedResponse } from '@rental/types'

export function Step2Ornaments() {
  const { selectedItems, addItem, removeItem, setStep, startDate, dueDate } = useRentalWizardStore()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [category, setCategory] = useState('')

  const { data: categories } = useQuery<string[]>({
    queryKey: keys.ornamentCategories(),
    queryFn: async () => (await api.get('/ornaments/categories')).data,
  })

  const { data, isLoading } = useQuery<PaginatedResponse<Ornament>>({
    queryKey: keys.ornaments({ search: debouncedSearch, category, available: 'true', startDate, dueDate }),
    queryFn: async () => {
      const params = new URLSearchParams({
        available: 'true',
        startDate,
        dueDate,
        limit: '40',
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (category) params.set('category', category)
      return (await api.get(`/ornaments?${params}`)).data
    },
    enabled: !!startDate && !!dueDate,
  })

  function clearSearch() { setSearch('') }

  const selectedIds = useMemo(() => new Set(selectedItems.map((i) => i.ornamentId)), [selectedItems])

  return (
    <div className="space-y-4">
      {/* Selected count badge */}
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-ink flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-ink">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-1">
            {selectedItems.map((item) => (
              <button
                key={item.ornamentId}
                onClick={() => removeItem(item.ornamentId)}
                className="flex items-center gap-1 text-xs bg-border text-ink px-2 py-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                {item.ornament.name.split(' ')[0]}
                <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + category filter */}
      <div className="space-y-2">
        <SearchInput
          placeholder="Search available ornaments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={search ? clearSearch : undefined}
        />
        {categories && categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategory('')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!category ? 'bg-ink text-white' : 'bg-surface text-muted border border-border'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(category === c ? '' : c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === c ? 'bg-ink text-white' : 'bg-surface text-muted border border-border'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available ornaments grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto">
        {isLoading && <p className="text-sm text-muted col-span-full py-4 text-center">Loading…</p>}
        {data?.data.length === 0 && !isLoading && (
          <p className="text-sm text-muted col-span-full py-4 text-center">No ornaments found</p>
        )}
        {data?.data.map((ornament) => {
          const isSelected = selectedIds.has(ornament.id)
          return (
            <button
              key={ornament.id}
              onClick={() => isSelected ? removeItem(ornament.id) : addItem(ornament, ornament.baseRatePerDay)}
              className={`flex flex-col rounded-2xl border overflow-hidden text-left transition-all ${
                isSelected
                  ? 'border-ink ring-2 ring-ink ring-offset-1'
                  : 'border-border hover:border-ink/30 hover:shadow-sm'
              }`}
            >
              <div className="aspect-square relative bg-surface">
                {ornament.images[0] ? (
                  <Image src={ornament.images[0].url} alt={ornament.name} fill className="object-cover" sizes="120px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">💍</div>
                )}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className="h-6 w-6 rounded-full bg-ink text-white flex items-center justify-center shadow-sm">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[10px] font-mono text-muted">{ornament.itemCode}</p>
                <p className="text-xs font-medium leading-tight line-clamp-2 mt-0.5">{ornament.name}</p>
                <p className="text-xs text-muted mt-1">{formatINR(ornament.baseRatePerDay)}/day</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={() => setStep(1)} size="lg">Back</Button>
        <Button onClick={() => setStep(3)} disabled={selectedItems.length === 0} size="lg" className="flex-1">
          Continue to customer
        </Button>
      </div>
    </div>
  )
}
