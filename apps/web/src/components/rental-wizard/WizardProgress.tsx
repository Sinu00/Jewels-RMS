import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = ['Dates', 'Ornaments', 'Customer', 'Pricing', 'Confirm']

export function WizardProgress({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-muted text-center mb-3">
        Step {step} of {STEPS.length} ·{' '}
        <span className="font-medium text-ink">{STEPS[step - 1]}</span>
      </p>
      <div className="flex items-center justify-center">
        {STEPS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3 | 4 | 5
          const done = stepNum < step
          const active = stepNum === step
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                    done ? 'bg-ink text-white' : active ? 'bg-ink text-white scale-110' : 'bg-border text-muted'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : stepNum}
                </div>
                <span
                  className={cn(
                    'mt-1 text-xs hidden sm:block',
                    active ? 'text-ink font-medium' : done ? 'text-muted' : 'text-muted/40'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-6 sm:w-10 mx-1 sm:mx-1.5 mb-4 rounded-full transition-colors',
                    done ? 'bg-ink' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
