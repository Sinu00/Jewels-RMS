'use client'

import Link from 'next/link'
import { Users, Building2, Tag, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { PageHeader } from '@/components/layout/PageHeader'

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

export default function SettingsPage() {
  const { isAdmin } = useAuthStore()

  if (!isAdmin()) {
    return <div className="p-6 text-muted">Admin access required.</div>
  }

  return (
    <div>
      <PageHeader title="Settings" back="/dashboard" />

      <div className="px-4 md:px-6 max-w-lg pb-8">
        <section>
          <h2 className="font-semibold text-ink mb-3">Master Data</h2>
          <div className="space-y-2">
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
      </div>
    </div>
  )
}
