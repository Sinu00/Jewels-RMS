'use client'

import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from '@/components/shared/Toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  // The app used to register a service worker (PWA). It's removed now, so clean
  // up any worker still installed in a user's browser — otherwise it would keep
  // serving stale cached pages. No-op once everyone has loaded the app once.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      })
    }
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
