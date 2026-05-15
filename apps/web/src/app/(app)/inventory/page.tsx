'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { OrnamentCard } from '@/components/shared/OrnamentCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Ornament, PaginatedResponse } from '@rental/types'

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [available, setAvailable] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data: categories } = useQuery<string[]>({
    queryKey: keys.ornamentCategories(),
    queryFn: async () => (await api.get('/ornaments/categories')).data,
  })

  const filters = { search: debouncedSearch, category, available }
  const { data, isLoading } = useQuery<PaginatedResponse<Ornament>>({
    queryKey: keys.ornaments(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (category) params.set('category', category)
      if (available) params.set('available', available)
      params.set('limit', '60')
      return (await api.get(`/ornaments?${params}`)).data
    },
  })

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    clearTimeout((window as any)._searchTimeout)
    ;(window as any)._searchTimeout = setTimeout(() => setDebouncedSearch(e.target.value), 350)
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={data ? `${data.total} ornament${data.total !== 1 ? 's' : ''}` : undefined}
        action={
          <Link href="/inventory/add">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="px-5 md:px-6 flex flex-col gap-3 mb-6">
        <SearchInput
          placeholder="Search by name or item code…"
          value={search}
          onChange={handleSearchChange}
          onClear={search ? () => { setSearch(''); setDebouncedSearch('') } : undefined}
        />
        <div className="flex gap-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1">
            <option value="">All categories</option>
            {categories?.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={available} onChange={(e) => setAvailable(e.target.value)} className="flex-1">
            <option value="">All items</option>
            <option value="true">Available only</option>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No ornaments found"
          description={search ? 'Try a different search.' : 'Add your first ornament to get started.'}
          action={
            !search ? (
              <Link href="/inventory/add">
                <Button size="sm"><Plus className="h-4 w-4" />Add Ornament</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="px-5 md:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data?.data.map((ornament) => (
            <OrnamentCard key={ornament.id} ornament={ornament} />
          ))}
        </div>
      )}
    </div>
  )
}
