'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Ornament } from '@rental/types'
import { AvailabilityDot } from './AvailabilityDot'
import { RupeeAmount } from './RupeeAmount'
import { cn } from '@/lib/utils'

interface OrnamentCardProps {
  ornament: Ornament
  onClick?: () => void
  actionSlot?: React.ReactNode
  selected?: boolean
  className?: string
}

export function OrnamentCard({ ornament, onClick, actionSlot, selected, className }: OrnamentCardProps) {
  const firstImage = ornament.images[0]

  const inner = (
    <div
      className={cn(
        'rounded-xl bg-card border border-border overflow-hidden cursor-pointer transition-shadow card-interactive',
        selected && 'ring-2 ring-gold ring-offset-1',
        className
      )}
      onClick={onClick}
    >
      {/* Photo */}
      <div className="aspect-square bg-bg relative overflow-hidden">
        {firstImage ? (
          <Image
            src={firstImage.url}
            alt={ornament.name}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/40">
            <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth={1}>
              <circle cx="24" cy="24" r="18" />
              <path d="M16 24 C16 19 20 15 24 15 C28 15 32 19 32 24" />
              <circle cx="24" cy="30" r="4" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="item-code">{ornament.itemCode}</p>
        <p className="mt-0.5 font-medium text-ink text-sm leading-snug line-clamp-2">{ornament.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <AvailabilityDot available={ornament.isAvailable} />
          <span className="text-xs text-muted font-display">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(ornament.baseRatePerDay)}/day</span>
        </div>
        {actionSlot && <div className="mt-2">{actionSlot}</div>}
      </div>
    </div>
  )

  if (!onClick) {
    return <Link href={`/inventory/${ornament.id}`}>{inner}</Link>
  }

  return inner
}
