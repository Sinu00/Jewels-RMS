'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, FileText, Users, CreditCard, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/rentals', label: 'Rentals', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, clearAuth, isAdmin } = useAuthStore()

  return (
    <aside className="flex h-full w-60 flex-col bg-card border-r border-border">
      <div className="px-5 py-6 border-b border-border">
        <h1 className="font-display text-xl text-gold">Jewels</h1>
        <p className="mt-0.5 text-xs text-muted truncate">{user?.outletName}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-muted hover:bg-bg hover:text-ink'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}

        {isAdmin() && (
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-gold/10 text-gold font-medium'
                : 'text-muted hover:bg-bg hover:text-ink'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold text-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-muted">{user?.role === 'ADMIN' ? 'Admin' : 'Staff'}</p>
          </div>
        </div>
        <button
          onClick={clearAuth}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-bg hover:text-ink transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
