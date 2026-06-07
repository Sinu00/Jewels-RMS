'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Only redirect once the persisted auth has been read from localStorage,
    // otherwise a page refresh briefly sees token=null and bounces to /login.
    if (hasHydrated && !token) {
      router.replace('/login')
    }
  }, [hasHydrated, token, router])

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <LoadingSpinner />
      </div>
    )
  }

  if (!token) return null

  return <ErrorBoundary><AppShell>{children}</AppShell></ErrorBoundary>
}
