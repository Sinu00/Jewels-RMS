import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/formatters'

interface RupeeAmountProps {
  amount: number
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function RupeeAmount({ amount, className, size = 'md' }: RupeeAmountProps) {
  return (
    <span
      className={cn(
        'font-display',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-xl',
        size === 'xl' && 'text-3xl',
        className
      )}
    >
      {formatINR(amount)}
    </span>
  )
}
