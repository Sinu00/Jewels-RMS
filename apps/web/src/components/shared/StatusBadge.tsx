import type { RentalStatus } from '@rental/types'

const CONFIG: Record<RentalStatus, { label: string; className: string }> = {
  ACTIVE:   { label: 'Active',   className: 'bg-green-100 text-green-800' },
  OVERDUE:  { label: 'Overdue',  className: 'bg-red-100 text-red-800' },
  EXTENDED: { label: 'Extended', className: 'bg-amber-100 text-amber-800' },
  RETURNED: { label: 'Returned', className: 'bg-gray-100 text-gray-600' },
}

export function StatusBadge({ status }: { status: RentalStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
