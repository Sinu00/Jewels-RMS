import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  back?: string
  className?: string
  /** Show the back button only on mobile; hide on md+ (where the sidebar covers this destination). */
  backMobileOnly?: boolean
}

export function PageHeader({ title, subtitle, action, back, className, backMobileOnly }: PageHeaderProps) {
  // back + action, mobile-only back → mobile: [← back] ... [action] / title below.
  // desktop (no back): single row [title ........ action], matching other top-level pages.
  if (back && action && backMobileOnly) {
    return (
      <div className={cn('px-5 pt-6 pb-4 md:px-6', className)}>
        <div className="flex flex-wrap items-center md:items-start gap-x-3 gap-y-3">
          <Link
            href={back}
            className="md:hidden order-1 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-ink text-white active:scale-95 transition-transform shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="order-3 md:order-1 w-full md:w-auto md:flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <div className="order-2 md:order-2 ml-auto shrink-0 flex items-center gap-2 md:mt-0.5">{action}</div>
        </div>
      </div>
    )
  }

  // back + action → top row: [← back] ... [actions], title below left-aligned
  if (back && action) {
    return (
      <div className={cn('px-5 pt-6 pb-4 md:px-6', className)}>
        <div className="flex items-center justify-between mb-3">
          <Link
            href={back}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-ink text-white active:scale-95 transition-transform shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">{action}</div>
        </div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
    )
  }

  // back only (no action) → single row: [← back] [title centered] [spacer]
  if (back) {
    return (
      <div className={cn('px-5 pt-6 pb-5 md:px-6', className)}>
        <div className="flex items-center gap-3">
          <Link
            href={back}
            className={cn(
              'inline-flex items-center justify-center h-9 w-9 rounded-xl bg-ink text-white active:scale-95 transition-transform shrink-0',
              backMobileOnly && 'md:hidden'
            )}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className={cn('flex-1 text-center', backMobileOnly && 'md:text-left')}>
            <h1 className="text-lg font-semibold text-ink tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {/* Mirror spacer keeps title perfectly centered */}
          <div className={cn('w-9 shrink-0', backMobileOnly && 'md:hidden')} />
        </div>
      </div>
    )
  }

  // no back → original layout: title left, action right
  return (
    <div className={cn('px-5 pt-6 pb-5 md:px-6', className)}>
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
