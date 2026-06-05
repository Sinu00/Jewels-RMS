'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { OrnamentCard } from '@/components/shared/OrnamentCard'
import { SkeletonGrid } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { InventoryExportMenu } from '@/components/shared/InventoryExportMenu'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Ornament, PaginatedResponse } from '@rental/types'

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [limit, setLimit] = useState(60)
  const debouncedSearch = useDebounce(search)

  // Reset paging whenever the filter set changes.
  useEffect(() => {
    setLimit(60)
  }, [debouncedSearch, category])

  const { data: categories } = useQuery<string[]>({
    queryKey: keys.ornamentCategories(),
    queryFn: async () => (await api.get('/ornaments/categories')).data,
    staleTime: 5 * 60 * 1000,
  })

  const filters = { search: debouncedSearch, category, limit }
  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<Ornament>>({
    queryKey: keys.ornaments(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (category) params.set('category', category)
      params.set('limit', String(limit))
      return (await api.get(`/ornaments?${params}`)).data
    },
  })

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={data ? `${data.total} ornament${data.total !== 1 ? 's' : ''}` : undefined}
        action={
          <div className="flex items-center gap-2">
            <InventoryExportMenu />
            <Link href="/inventory/add">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="px-5 md:px-6 flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="md:flex-1">
          <SearchInput
            placeholder="Search by name or item code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={search ? () => setSearch('') : undefined}
          />
        </div>
        <div className="flex gap-2 md:w-56">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1">
            <option value="">All categories</option>
            {categories?.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <SkeletonGrid count={10} />
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
        <>
          <div className="px-5 md:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data?.data.map((ornament) => (
              <OrnamentCard key={ornament.id} ornament={ornament} />
            ))}
          </div>
          {data && data.data.length < data.total && (
            <div className="px-5 md:px-6 pt-5 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => setLimit((l) => l + 60)}
              >
                {isFetching ? 'Loading…' : `Load more (${data.data.length} of ${data.total})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
