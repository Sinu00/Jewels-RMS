export function AvailabilityDot({ available }: { available: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`status-dot ${available ? 'status-dot--available' : 'status-dot--rented'}`} />
      <span className={`text-xs ${available ? 'text-green-700' : 'text-amber-700'}`}>
        {available ? 'Available' : 'Rented'}
      </span>
    </span>
  )
}
