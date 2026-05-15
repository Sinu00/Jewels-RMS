'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'

export default function AddOrnamentPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', category: '', baseRatePerDay: '', description: '',
  })
  const [customCategory, setCustomCategory] = useState('')
  const [error, setError] = useState('')

  const { data: masterCategories } = useQuery<string[]>({
    queryKey: keys.settingsCategories(),
    queryFn: async () => (await api.get('/settings/categories')).data,
  })

  const allCategories = (masterCategories ?? []).slice().sort()

  type MutationVars = { name: string; category: string; baseRatePerDay: number; description?: string; isCustom: boolean }

  const mutation = useMutation({
    mutationFn: async ({ isCustom: _, ...body }: MutationVars) => (await api.post('/ornaments', body)).data,
    onSuccess: async (data, { isCustom, category }) => {
      if (isCustom) {
        const current = masterCategories ?? []
        if (!current.includes(category)) {
          await api.patch('/settings/categories', { categories: [...current, category] })
          queryClient.invalidateQueries({ queryKey: keys.settingsCategories() })
        }
      }
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      router.push(`/inventory/${data.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to add ornament'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalCategory = form.category === '__custom__' ? customCategory.trim() : form.category
    if (!finalCategory) return setError('Category is required')
    mutation.mutate({
      name: form.name,
      category: finalCategory,
      baseRatePerDay: Number(form.baseRatePerDay),
      description: form.description || undefined,
      isCustom: form.category === '__custom__',
    })
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div>
      <PageHeader
        title="Add Ornament"
        action={
          <Link href="/inventory">
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="px-4 md:px-6 max-w-lg space-y-4 pb-8">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input placeholder="e.g. Kundan Bridal Necklace Set" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onChange={(e) => set('category', e.target.value)} required>
            <option value="">Select category</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__custom__">Other (type below)</option>
          </Select>
          {form.category === '__custom__' && (
            <Input
              placeholder="Enter category name"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              required
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Rate per Day (₹) *</Label>
          <Input type="number" min="0" placeholder="e.g. 500" value={form.baseRatePerDay} onChange={(e) => set('baseRatePerDay', e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea placeholder="Optional description..." value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="pt-2">
          <Button type="submit" disabled={mutation.isPending} size="lg" className="w-full">
            {mutation.isPending ? 'Adding...' : 'Add Ornament'}
          </Button>
        </div>
      </form>
    </div>
  )
}
