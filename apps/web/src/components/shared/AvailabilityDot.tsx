import { cn } from '@/lib/utils'

export function AvailabilityDot({ available }: { available: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block h-2 w-2 rounded-full',
          available ? 'bg-green-500' : 'bg-amber-500'
        )}
      />
      <span className={cn('text-xs', available ? 'text-green-700' : 'text-amber-700')}>
        {available ? 'Available' : 'Rented'}
      </span>
    </span>
  )
}
