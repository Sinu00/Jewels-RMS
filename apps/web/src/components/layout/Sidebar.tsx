'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, FileText, Users, CreditCard, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/inventory',  label: 'Inventory',  icon: Package },
  { href: '/rentals',    label: 'Rentals',    icon: FileText },
  { href: '/customers',  label: 'Customers',  icon: Users },
  { href: '/accounts',   label: 'Accounts',   icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, clearAuth, isAdmin } = useAuthStore()

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-card border-r border-border">
      {/* Brand */}
      <div className="px-5 pt-7 pb-6 border-b border-border">
        <p className="font-display text-2xl text-ink leading-none tracking-tight">Jewels</p>
        <p className="mt-1.5 text-xs text-muted truncate">{user?.outletName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
              isActive(href)
                ? 'bg-ink text-white font-medium'
                : 'text-muted hover:bg-surface hover:text-ink'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive(href) ? 2 : 1.5} />
            {label}
          </Link>
        ))}

        {isAdmin() && (
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
              isActive('/settings')
                ? 'bg-ink text-white font-medium'
                : 'text-muted hover:bg-surface hover:text-ink'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={isActive('/settings') ? 2 : 1.5} />
            Settings
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface">
          <div className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-ink text-sm font-semibold shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-muted">{user?.role === 'ADMIN' ? 'Admin' : 'Staff'}</p>
          </div>
          <button
            onClick={clearAuth}
            className="shrink-0 text-muted hover:text-ink transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
