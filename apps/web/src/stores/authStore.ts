import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@rental/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  hasHydrated: boolean
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  isAdmin: () => boolean
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      isAdmin: () => get().user?.role === 'ADMIN',
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'rental-auth',
      // Only persist auth data; hasHydrated must always start false on load.
      partialize: (s) => ({ token: s.token, user: s.user }),
      // Fires once localStorage has been read back into the store.
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
)
