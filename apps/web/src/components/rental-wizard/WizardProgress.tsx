import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = ['Customer', 'Ornaments', 'Dates & Rates', 'Confirm']

export function WizardProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-4">
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3 | 4
        const done = stepNum < step
        const active = stepNum === step
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  done ? 'bg-gold text-white' : active ? 'bg-gold text-white' : 'bg-border text-muted'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span className={cn('mt-1 text-xs hidden sm:block', active ? 'text-gold font-medium' : 'text-muted')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 w-8 sm:w-16 mx-1 sm:mx-2 mb-4', done ? 'bg-gold' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
