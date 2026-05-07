'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useRentalWizardStore } from '@/stores/rentalWizardStore'
import { WizardProgress } from '@/components/rental-wizard/WizardProgress'
import { Step1Customer } from '@/components/rental-wizard/Step1Customer'
import { Step2Ornaments } from '@/components/rental-wizard/Step2Ornaments'
import { Step3Rates } from '@/components/rental-wizard/Step3Rates'
import { Step4Confirm } from '@/components/rental-wizard/Step4Confirm'
import { Button } from '@/components/ui/button'

export default function NewRentalPage() {
  const { step, reset } = useRentalWizardStore()

  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-5 pb-2 md:px-6">
        <Link href="/rentals" onClick={reset}>
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" />Cancel</Button>
        </Link>
        <h1 className="font-semibold text-ink flex-1">New Rental</h1>
      </div>

      <WizardProgress step={step} />

      <div className="px-4 md:px-6 pb-8 max-w-lg">
        {step === 1 && <Step1Customer />}
        {step === 2 && <Step2Ornaments />}
        {step === 3 && <Step3Rates />}
        {step === 4 && <Step4Confirm />}
      </div>
    </div>
  )
}
