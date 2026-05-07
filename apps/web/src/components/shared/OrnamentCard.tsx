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
        'rounded-xl bg-card border border-border overflow-hidden cursor-pointer transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-gold',
        className
      )}
      onClick={onClick}
    >
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
          <div className="flex h-full items-center justify-center text-muted text-4xl">💍</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-muted font-mono">{ornament.itemCode}</p>
        <p className="mt-0.5 font-medium text-ink text-sm leading-tight line-clamp-2">{ornament.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <AvailabilityDot available={ornament.isAvailable} />
          <RupeeAmount amount={ornament.baseRatePerDay} size="sm" className="text-muted" />
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
