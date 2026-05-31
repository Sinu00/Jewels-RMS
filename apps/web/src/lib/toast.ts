import { useToastStore } from '@/stores/toastStore'

// Convenience helpers usable from anywhere (event handlers, mutation callbacks),
// not just React components.
export const toast = {
  success: (message: string) => useToastStore.getState().addToast('success', message),
  error: (message: string) => useToastStore.getState().addToast('error', message),
  info: (message: string) => useToastStore.getState().addToast('info', message),
}
