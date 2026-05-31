'use client'

import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from '@/stores/toastStore'

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const STYLES: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-border bg-card text-ink',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-600',
  error: 'text-red-500',
  info: 'text-muted',
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none md:items-end md:right-6 md:left-auto md:px-0">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-float animate-in fade-in slide-in-from-top-2 duration-200 ${STYLES[t.type]}`}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${ICON_STYLES[t.type]}`} />
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
