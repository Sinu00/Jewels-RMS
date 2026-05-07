'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Floating New Rental button — mobile only */}
      <Link
        href="/rentals/new"
        className="fixed bottom-20 right-4 z-50 md:hidden flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-lg active:scale-95 transition-transform"
        aria-label="New Rental"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  )
}
