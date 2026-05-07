'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { OrnamentCard } from '@/components/shared/OrnamentCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Ornament, PaginatedResponse } from '@rental/types'

export default function InventoryPage() {
  const { isAdmin } = useAuthStore()
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
      params.set('limit', '50')
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
        subtitle={data ? `${data.total} ornaments` : undefined}
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
      <div className="px-4 md:px-6 flex gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search by name or code..."
            className="pl-9"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-40">
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={available} onChange={(e) => setAvailable(e.target.value)} className="w-36">
          <option value="">All status</option>
          <option value="true">Available</option>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No ornaments found"
          description="Try adjusting your filters or add a new ornament."
          action={
            <Link href="/inventory/add">
              <Button size="sm"><Plus className="h-4 w-4" />Add Ornament</Button>
            </Link>
          }
        />
      ) : (
        <div className="px-4 md:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {data?.data.map((ornament) => (
            <OrnamentCard key={ornament.id} ornament={ornament} />
          ))}
        </div>
      )}
    </div>
  )
}
