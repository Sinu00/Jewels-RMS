import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@rental/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'rental-auth',
    }
  )
)
