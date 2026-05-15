'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, FileText, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/rentals', label: 'Rentals', icon: FileText },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-5 left-4 right-[68px] z-40 bg-ink rounded-3xl flex md:hidden shadow-nav overflow-hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center py-2.5 gap-0.5 text-[9px] font-medium transition-all',
              active
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Icon className={cn('h-4 w-4 transition-transform', active && 'scale-110')} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
