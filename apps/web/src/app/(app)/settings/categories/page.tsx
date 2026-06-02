'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [saved, setSaved] = useState(false)

  const { data: masterCategories, isLoading } = useQuery<string[]>({
    queryKey: keys.settingsCategories(),
    queryFn: async () => (await api.get('/settings/categories')).data,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (masterCategories) setCategories(masterCategories)
  }, [masterCategories])

  const saveMutation = useMutation({
    mutationFn: (cats: string[]) => api.patch('/settings/categories', { categories: cats }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.settingsCategories() })
      queryClient.invalidateQueries({ queryKey: keys.ornamentCategories() })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  function addCategory() {
    const trimmed = newCategory.trim()
    if (!trimmed || categories.includes(trimmed)) return
    setCategories((prev) => [...prev, trimmed])
    setNewCategory('')
  }

  return (
    <div>
      <PageHeader title="Ornament Categories" back="/settings" />

      <div className="px-4 md:px-6 max-w-3xl mx-auto pb-8">
        <p className="text-sm text-muted mb-5">
          These categories appear in the add ornament dropdown. Changes apply to all new ornaments.
        </p>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {/* Category chips */}
            <div className="flex flex-wrap gap-2 min-h-[48px]">
              {categories.length === 0 && (
                <p className="text-sm text-muted">No categories yet. Add one below.</p>
              )}
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 bg-surface border border-border text-ink text-sm px-3 py-1.5 rounded-full"
                >
                  {cat}
                  <button
                    onClick={() => setCategories((prev) => prev.filter((c) => c !== cat))}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add input */}
            <div className="flex gap-2">
              <Input
                placeholder="New category name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                className="flex-1"
              />
              <Button variant="outline" onClick={addCategory} disabled={!newCategory.trim()}>
                Add
              </Button>
            </div>

            {saved && <p className="text-sm text-green-600">Categories saved!</p>}

            <Button
              onClick={() => saveMutation.mutate(categories)}
              disabled={saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Categories'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
