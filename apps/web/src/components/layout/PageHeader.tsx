import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  back?: string
  className?: string
}

export function PageHeader({ title, subtitle, action, back, className }: PageHeaderProps) {
  return (
    <div className={cn('px-5 pt-6 pb-5 md:px-6', className)}>
      {back && (
        <Link
          href={back}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-3 -ml-0.5 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 mt-0.5">{action}</div>}
      </div>
    </div>
  )
}
