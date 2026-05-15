'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, Users, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { isAdmin } = useAuthStore()
  const [outletForm, setOutletForm] = useState({ name: '', address: '', phone: '' })
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'STAFF' })
  const [addError, setAddError] = useState('')
  const [outletError, setOutletError] = useState('')
  const [outletSuccess, setOutletSuccess] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [catSaved, setCatSaved] = useState(false)

  const STATIC = 5 * 60 * 1000

  const { data: outlet, isLoading: loadingOutlet } = useQuery({
    queryKey: keys.settings(),
    queryFn: async () => (await api.get('/settings/outlet')).data,
    enabled: isAdmin(),
    staleTime: STATIC,
  })

  const { data: staff, isLoading: loadingStaff } = useQuery({
    queryKey: keys.staff(),
    queryFn: async () => (await api.get('/settings/staff')).data,
    enabled: isAdmin(),
    staleTime: STATIC,
  })

  const { data: masterCategories, isLoading: loadingCats } = useQuery<string[]>({
    queryKey: keys.settingsCategories(),
    queryFn: async () => (await api.get('/settings/categories')).data,
    enabled: isAdmin(),
    staleTime: STATIC,
  })

  useEffect(() => {
    if (outlet) {
      setOutletForm({ name: outlet.name ?? '', address: outlet.address ?? '', phone: outlet.phone ?? '' })
    }
  }, [outlet])

  useEffect(() => {
    if (masterCategories) setCategories(masterCategories)
  }, [masterCategories])

  const outletMutation = useMutation({
    mutationFn: (body: object) => api.patch('/settings/outlet', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.settings() })
      setOutletSuccess(true)
      setTimeout(() => setOutletSuccess(false), 3000)
    },
    onError: (err: any) => setOutletError(err.response?.data?.error ?? 'Failed'),
  })

  const addStaffMutation = useMutation({
    mutationFn: (body: object) => api.post('/settings/staff', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.staff() })
      setStaffForm({ name: '', email: '', password: '', role: 'STAFF' })
      setAddError('')
    },
    onError: (err: any) => setAddError(err.response?.data?.error ?? 'Failed'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/settings/staff/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.staff() }),
  })

  const saveCategoriesMutation = useMutation({
    mutationFn: (cats: string[]) => api.patch('/settings/categories', { categories: cats }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.settingsCategories() })
      queryClient.invalidateQueries({ queryKey: keys.ornamentCategories() })
      setCatSaved(true)
      setTimeout(() => setCatSaved(false), 3000)
    },
  })

  function addCategory() {
    const trimmed = newCategory.trim()
    if (!trimmed || categories.includes(trimmed)) return
    setCategories((prev) => [...prev, trimmed])
    setNewCategory('')
  }

  function removeCategory(cat: string) {
    setCategories((prev) => prev.filter((c) => c !== cat))
  }

  if (!isAdmin()) {
    return <div className="p-6 text-muted">Admin access required.</div>
  }

  return (
    <div>
      <PageHeader title="Settings" back="/dashboard" />

      <div className="px-4 md:px-6 max-w-lg space-y-8 pb-8">
        {/* Master data links */}
        <section>
          <h2 className="font-semibold text-ink mb-3">Master Data</h2>
          <Link href="/customers">
            <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3.5 hover:border-ink transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center">
                  <Users className="h-4 w-4 text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Customer Master</p>
                  <p className="text-xs text-muted">View and manage all customers</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </div>
          </Link>
        </section>

        {/* Outlet info */}
        <section>
          <h2 className="font-semibold text-ink mb-3">Outlet Information</h2>
          {loadingOutlet ? <LoadingSpinner /> : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Outlet Name</Label>
                <Input value={outletForm.name} onChange={(e) => setOutletForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={outletForm.address} onChange={(e) => setOutletForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={outletForm.phone} onChange={(e) => setOutletForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              {outletError && <p className="text-sm text-red-600">{outletError}</p>}
              {outletSuccess && <p className="text-sm text-green-600">Saved successfully!</p>}
              <Button onClick={() => outletMutation.mutate(outletForm)} disabled={outletMutation.isPending}>
                {outletMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </section>

        {/* Ornament Categories */}
        <section>
          <h2 className="font-semibold text-ink mb-1">Ornament Categories</h2>
          <p className="text-xs text-muted mb-3">These categories appear in the add ornament form.</p>
          {loadingCats ? <LoadingSpinner /> : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 bg-surface border border-border text-ink text-xs px-3 py-1.5 rounded-full"
                  >
                    {cat}
                    <button onClick={() => removeCategory(cat)} className="text-muted hover:text-red-500 ml-1 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {categories.length === 0 && <p className="text-xs text-muted">No categories yet.</p>}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  className="flex-1"
                />
                <Button variant="outline" onClick={addCategory} disabled={!newCategory.trim()}>
                  Add
                </Button>
              </div>
              {catSaved && <p className="text-sm text-green-600">Categories saved!</p>}
              <Button
                onClick={() => saveCategoriesMutation.mutate(categories)}
                disabled={saveCategoriesMutation.isPending}
                size="sm"
              >
                {saveCategoriesMutation.isPending ? 'Saving...' : 'Save Categories'}
              </Button>
            </div>
          )}
        </section>

        {/* Staff management */}
        <section>
          <h2 className="font-semibold text-ink mb-3">Staff Accounts</h2>
          {loadingStaff ? <LoadingSpinner /> : (
            <div className="space-y-2 mb-4">
              {staff?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted">{s.email} · {s.role}</p>
                  </div>
                  <button
                    onClick={() => toggleActive.mutate({ id: s.id, isActive: !s.isActive })}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
                      s.isActive ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                    )}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3 className="font-medium text-sm text-ink mb-2">Add Staff Account</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={staffForm.name} onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={staffForm.role} onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={staffForm.email} onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))} placeholder="staff@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={staffForm.password} onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <Button
              onClick={() => addStaffMutation.mutate(staffForm)}
              disabled={addStaffMutation.isPending || !staffForm.name || !staffForm.email || !staffForm.password}
            >
              {addStaffMutation.isPending ? 'Adding...' : 'Add Staff'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
