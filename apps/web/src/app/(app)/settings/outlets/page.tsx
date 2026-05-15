'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, ChevronDown, ChevronUp, Trash2, Edit2, Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { keys } from '@/lib/queryKeys'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Outlet = { id: string; name: string; address: string | null; phone: string | null; userCount: number }
type StaffUser = { id: string; name: string; email: string; role: string; isActive: boolean }

function OutletRow({ outlet }: { outlet: Outlet }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: outlet.name, address: outlet.address ?? '', phone: outlet.phone ?? '' })
  const [showAddUser, setShowAddUser] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'STAFF' })
  const [userError, setUserError] = useState('')
  const [editError, setEditError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: staff, isLoading: loadingStaff } = useQuery<StaffUser[]>({
    queryKey: keys.outletStaff(outlet.id),
    queryFn: async () => (await api.get(`/settings/outlets/${outlet.id}/staff`)).data,
    enabled: expanded,
  })

  const editMutation = useMutation({
    mutationFn: (body: object) => api.patch(`/settings/outlets/${outlet.id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.outlets() })
      setEditing(false)
      setEditError('')
    },
    onError: (err: any) => setEditError(err.response?.data?.error ?? 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/settings/outlets/${outlet.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.outlets() }),
    onError: (err: any) => setEditError(err.response?.data?.error ?? 'Failed to delete'),
  })

  const addUserMutation = useMutation({
    mutationFn: (body: object) => api.post(`/settings/outlets/${outlet.id}/staff`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.outletStaff(outlet.id) })
      queryClient.invalidateQueries({ queryKey: keys.outlets() })
      setUserForm({ name: '', email: '', password: '', role: 'STAFF' })
      setShowAddUser(false)
      setUserError('')
    },
    onError: (err: any) => setUserError(err.response?.data?.error ?? 'Failed'),
  })

  const toggleUser = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.patch(`/settings/outlets/${outlet.id}/staff/${userId}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.outletStaff(outlet.id) }),
  })

  const removeUser = useMutation({
    mutationFn: (userId: string) => api.delete(`/settings/outlets/${outlet.id}/staff/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.outletStaff(outlet.id) })
      queryClient.invalidateQueries({ queryKey: keys.outlets() })
    },
  })

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Outlet header */}
      <div className="px-4 py-3.5">
        {editing ? (
          <div className="space-y-2">
            <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Outlet name" />
            <Input value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" />
            <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" />
            {editError && <p className="text-xs text-red-600">{editError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => editMutation.mutate(editForm)} disabled={editMutation.isPending || !editForm.name}>
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditError('') }}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink">{outlet.name}</p>
              {(outlet.address || outlet.phone) && (
                <p className="text-xs text-muted mt-0.5 truncate">
                  {[outlet.address, outlet.phone].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="text-xs text-muted mt-0.5">{outlet.userCount} user{outlet.userCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              <button onClick={() => setEditing(true)} className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-ink transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              {confirmDelete ? (
                <div className="flex gap-1">
                  <button onClick={() => deleteMutation.mutate()} className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white font-medium">
                    Confirm
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 rounded-lg bg-surface text-muted">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => setExpanded((e) => !e)} className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-ink transition-colors">
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users section */}
      {expanded && (
        <div className="border-t border-border">
          {loadingStaff ? (
            <LoadingSpinner />
          ) : (
            <>
              {staff?.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 text-sm">
                  <div>
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-muted">{s.email} · {s.role}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => toggleUser.mutate({ userId: s.id, isActive: !s.isActive })}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
                        s.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-surface hover:text-muted'
                          : 'bg-surface text-muted hover:bg-green-100 hover:text-green-700'
                      )}
                    >
                      {s.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => removeUser.mutate(s.id)} className="text-muted hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add user */}
              {showAddUser ? (
                <div className="px-4 py-3 space-y-2 border-t border-border bg-surface/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input placeholder="Full name" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} />
                    <Select value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </div>
                  <Input type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} />
                  <Input type="password" placeholder="Password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} />
                  {userError && <p className="text-xs text-red-600">{userError}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addUserMutation.mutate(userForm)} disabled={addUserMutation.isPending || !userForm.name || !userForm.email || !userForm.password}>
                      {addUserMutation.isPending ? 'Adding...' : 'Add User'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowAddUser(false); setUserError('') }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted hover:text-ink hover:bg-surface/50 transition-colors border-t border-border"
                >
                  <Plus className="h-4 w-4" />
                  Add user to this outlet
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function OutletMasterPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', address: '', phone: '' })
  const [addError, setAddError] = useState('')

  const { data: outlets, isLoading } = useQuery<Outlet[]>({
    queryKey: keys.outlets(),
    queryFn: async () => (await api.get('/settings/outlets')).data,
  })

  const addMutation = useMutation({
    mutationFn: (body: object) => api.post('/settings/outlets', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.outlets() })
      setAddForm({ name: '', address: '', phone: '' })
      setShowAdd(false)
      setAddError('')
    },
    onError: (err: any) => setAddError(err.response?.data?.error ?? 'Failed'),
  })

  return (
    <div>
      <PageHeader
        title="Outlet Master"
        back="/settings"
        action={
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-4 w-4" />
            Add Outlet
          </Button>
        }
      />

      <div className="px-4 md:px-6 max-w-lg space-y-3 pb-8">
        {/* Add outlet form */}
        {showAdd && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-medium text-sm text-ink">New Outlet</h3>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="Branch name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Full address" value={addForm.address} onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="Contact number" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex gap-2">
              <Button onClick={() => addMutation.mutate(addForm)} disabled={addMutation.isPending || !addForm.name}>
                {addMutation.isPending ? 'Creating...' : 'Create Outlet'}
              </Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setAddError('') }}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : outlets?.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">No outlets yet. Add one above.</p>
        ) : (
          outlets?.map((o) => <OutletRow key={o.id} outlet={o} />)
        )}
      </div>
    </div>
  )
}
