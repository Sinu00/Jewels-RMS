'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Ornament, OrnamentImage } from '@rental/types'

export default function EditOrnamentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', baseRatePerDay: '', description: '' })
  const [images, setImages] = useState<OrnamentImage[]>([])
  const [error, setError] = useState('')

  const { data: ornament, isLoading } = useQuery<Ornament>({
    queryKey: keys.ornament(id),
    queryFn: async () => (await api.get(`/ornaments/${id}`)).data,
  })

  useEffect(() => {
    if (ornament) {
      setForm({
        name: ornament.name,
        baseRatePerDay: ornament.baseRatePerDay.toString(),
        description: ornament.description ?? '',
      })
      setImages(ornament.images)
    }
  }, [ornament])

  const mutation = useMutation({
    mutationFn: (body: object) => api.patch(`/ornaments/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.ornament(id) })
      queryClient.invalidateQueries({ queryKey: keys.ornaments() })
      router.push(`/inventory/${id}`)
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Failed to save'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      name: form.name,
      baseRatePerDay: Number(form.baseRatePerDay),
      description: form.description || null,
    })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Edit Ornament"
        action={<Link href={`/inventory/${id}`}><Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <form onSubmit={handleSubmit} className="px-4 md:px-6 max-w-lg space-y-4 pb-8">
        <div className="space-y-1.5">
          <Label>Photos</Label>
          <ImageUploader ornamentId={id} images={images} onImagesChange={setImages} />
        </div>

        <div className="space-y-1.5">
          <Label>Item Code</Label>
          <Input value={ornament?.itemCode ?? ''} disabled className="font-mono" />
        </div>

        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>

        <div className="space-y-1.5">
          <Label>Rate per Day (₹) *</Label>
          <Input type="number" min="0" value={form.baseRatePerDay} onChange={(e) => setForm((f) => ({ ...f, baseRatePerDay: e.target.value }))} required />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" disabled={mutation.isPending} size="lg" className="w-full">
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
