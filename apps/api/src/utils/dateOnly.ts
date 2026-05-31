/** Inclusive start, exclusive end — safe for Prisma @db.Date fields. */
export function dateOnlyRange(input: string | Date): { gte: Date; lt: Date } {
  const gte = new Date(input)
  const lt = new Date(gte)
  lt.setUTCDate(lt.getUTCDate() + 1)
  return { gte, lt }
}

/** Calendar day range for "today" in local timezone, as YYYY-MM-DD boundaries. */
export function todayDateOnlyRange(): { gte: Date; lt: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const todayStr = `${y}-${m}-${d}`
  return dateOnlyRange(todayStr)
}
