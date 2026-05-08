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
    <aside className="flex h-full w-56 flex-col bg-card border-r border-border">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <p className="font-display text-2xl text-gold leading-none">Jewels</p>
        <p className="mt-1 text-xs text-muted truncate">{user?.outletName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive(href)
                ? 'bg-gold/10 text-gold font-medium'
                : 'text-muted hover:bg-bg hover:text-ink'
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
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive('/settings')
                ? 'bg-gold/10 text-gold font-medium'
                : 'text-muted hover:bg-bg hover:text-ink'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={isActive('/settings') ? 2 : 1.5} />
            Settings
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="h-7 w-7 rounded-full bg-gold/15 flex items-center justify-center text-gold text-xs font-semibold shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ink truncate">{user?.name}</p>
            <p className="text-xs text-muted">{user?.role === 'ADMIN' ? 'Admin' : 'Staff'}</p>
          </div>
        </div>
        <button
          onClick={clearAuth}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted hover:bg-bg hover:text-ink transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
