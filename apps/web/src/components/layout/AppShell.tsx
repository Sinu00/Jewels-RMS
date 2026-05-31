'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, X, RotateCcw, ShoppingBag, Package } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [fabOpen, setFabOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  const hideFab = pathname === '/rentals/new' || pathname === '/rentals/return' || pathname === '/rentals/pickup'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false)
      }
    }
    if (fabOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [fabOpen])

  return (
    <div className="flex h-screen bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-32 md:pb-0">
        {children}
      </main>

      {/* Floating pill bottom nav */}
      <BottomNav />

      {/* FAB with dropdown — sits at same level as BottomNav, to its right */}
      {!hideFab && (
        <div ref={fabRef} className="fixed bottom-5 right-4 z-50 md:hidden flex flex-col items-end gap-2">
          {fabOpen && (
            <div className="flex flex-col items-end gap-2 mb-1">
              <button
                onClick={() => { setFabOpen(false); router.push('/rentals/new') }}
                className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-float"
              >
                <ShoppingBag className="h-4 w-4" />
                Rent
              </button>
              <button
                onClick={() => { setFabOpen(false); router.push('/rentals/pickup') }}
                className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-float"
              >
                <Package className="h-4 w-4" />
                Pickup
              </button>
              <button
                onClick={() => { setFabOpen(false); router.push('/rentals/return') }}
                className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-float"
              >
                <RotateCcw className="h-4 w-4" />
                Return
              </button>
            </div>
          )}
          <button
            onClick={() => setFabOpen((o) => !o)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-float active:scale-95 transition-transform"
            aria-label="Actions"
          >
            {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </button>
        </div>
      )}
    </div>
  )
}
