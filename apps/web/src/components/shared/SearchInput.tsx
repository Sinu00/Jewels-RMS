'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export function SearchInput({ className, value, onClear, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
      <input
        className={cn(
          'flex h-12 w-full rounded-full border border-border bg-surface pl-11 pr-10 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:bg-card focus-visible:border-ink/20 transition-colors',
          className
        )}
        value={value}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted/15 flex items-center justify-center hover:bg-muted/25 transition-colors"
        >
          <X className="h-3 w-3 text-muted" />
        </button>
      )}
    </div>
  )
}
