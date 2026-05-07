import type { RentalStatus } from '@rental/types'
import { Badge } from '@/components/ui/badge'

const labels: Record<RentalStatus, string> = {
  ACTIVE: 'Active',
  OVERDUE: 'Overdue',
  EXTENDED: 'Extended',
  RETURNED: 'Returned',
}

const variants: Record<RentalStatus, 'active' | 'overdue' | 'extended' | 'returned'> = {
  ACTIVE: 'active',
  OVERDUE: 'overdue',
  EXTENDED: 'extended',
  RETURNED: 'returned',
}

export function StatusBadge({ status }: { status: RentalStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
