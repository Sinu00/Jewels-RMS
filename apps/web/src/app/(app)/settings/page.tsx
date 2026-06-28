'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Building2, Tag, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'

const masterItems = [
  {
    href: '/customers',
    icon: Users,
    label: 'Customer Master',
    description: 'View and manage all customers',
  },
  {
    href: '/settings/outlets',
    icon: Building2,
    label: 'Outlet Master',
    description: 'Manage outlets and their staff',
  },
  {
    href: '/settings/categories',
    icon: Tag,
    label: 'Ornament Categories',
    description: 'Manage ornament category list',
  },
]

interface ClearResult {
  payments: number
  rentalExtensions: number
  rentalItems: number
  rentals: number
  customers: number
}

export default function SettingsPage() {
  const { isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const [showClear, setShowClear] = useState(false)
  const [password, setPassword] = useState('')

  const clearMutation = useMutation({
    mutationFn: async (pw: string) =>
      (await api.post<{ success: boolean; deleted: ClearResult }>('/settings/clear-data', { password: pw })).data,
    onSuccess: ({ deleted }) => {
      // Rentals/customers/payments are gone and ornament availability changed —
      // drop the cached views so everything reflects the wipe.
      ;['dashboard', 'rentals', 'customers', 'payments', 'ornaments'].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [k] })
      )
      toast.success(
        `Cleared ${deleted.rentals} rentals, ${deleted.customers} customers, ${deleted.payments} payments.`
      )
      closeClear()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Could not clear data. Please try again.')
    },
  })

  function closeClear() {
    setShowClear(false)
    setPassword('')
  }

  if (!isAdmin()) {
    return <div className="p-6 text-muted">Admin access required.</div>
  }

  return (
    <div>
      <PageHeader title="Settings" back="/dashboard" backMobileOnly />

      <div className="px-4 md:px-6 max-w-3xl mx-auto pb-8">
        <section>
          <h2 className="font-semibold text-ink mb-3">Master Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {masterItems.map(({ href, icon: Icon, label, description }) => (
              <Link key={href} href={href}>
                <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3.5 hover:border-ink transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <p className="text-xs text-muted">{description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-red-600 mb-3">Danger Zone</h2>
          <div className="flex items-center justify-between bg-card border border-red-200 rounded-xl px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Clear Data</p>
                <p className="text-xs text-muted">
                  Delete all rentals, payments and customers for this branch. Inventory is kept.
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowClear(true)}>
              Clear
            </Button>
          </div>
        </section>
      </div>

      {showClear && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={clearMutation.isPending ? undefined : closeClear}
          />
          <div className="relative bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm md:max-w-md shadow-xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-semibold text-base">Clear all data?</h3>
            </div>
            <p className="mt-2 text-sm text-muted">
              This permanently deletes every rental, payment and customer for this branch. Inventory
              (ornaments and photos) and staff accounts are kept. This cannot be undone.
            </p>
            <p className="mt-3 text-sm text-ink font-medium">Enter the password to confirm</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (password) clearMutation.mutate(password)
              }}
            >
              <Input
                type="password"
                autoFocus
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={clearMutation.isPending}
                className="mt-2"
              />
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeClear}
                  disabled={clearMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="flex-1"
                  disabled={clearMutation.isPending || !password}
                >
                  {clearMutation.isPending ? 'Clearing...' : 'Clear data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
