import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface', className)} />
}

/** A list of placeholder rows mirroring the rental/customer list layout. */
export function SkeletonList({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('px-5 md:px-6 space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card"
        >
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

/** A grid of placeholder cards mirroring the inventory ornament grid. */
export function SkeletonGrid({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        'px-5 md:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
