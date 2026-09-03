import { describe, it, expect, vi } from 'vitest'

// availability.ts imports the Prisma client at module load. The two things under
// test here are pure, so stub the client out rather than standing up a database.
// vi.mock is hoisted above the imports, so the stub is in place before
// availability.ts is evaluated — no dynamic import needed.
vi.mock('../../lib/prisma', () => ({ prisma: {} }))

import { BLOCKING_STATUSES, ACTIVE_STATUSES, rentalDateOverlapFilter } from '../availability'

/**
 * A piece of jewellery can only be on one booking at a time, so double-booking
 * is the failure this module exists to prevent. Two rules decide it: WHICH
 * rental statuses reserve a piece, and WHICH date ranges count as overlapping.
 */
describe('BLOCKING_STATUSES — which rentals reserve a piece', () => {
  it('reserves a piece that is booked ahead but not yet collected', () => {
    // The bug this guards: only blocking on physically-out rentals lets a second
    // customer book the same piece for dates a first customer already holds.
    expect(BLOCKING_STATUSES).toContain('BOOKED')
  })

  it('reserves pieces that are out, late, or on an extension', () => {
    expect(BLOCKING_STATUSES).toEqual(
      expect.arrayContaining(['ACTIVE', 'OVERDUE', 'EXTENDED'])
    )
  })

  it.each(['RETURNED', 'CANCELLED'])(
    'releases a %s rental — otherwise the piece is reserved forever',
    (status) => {
      expect(BLOCKING_STATUSES).not.toContain(status)
    }
  )

  it('runs the overdue sweep only over pieces actually with a customer', () => {
    // A BOOKED rental has not been collected, so it can never become OVERDUE.
    expect(ACTIVE_STATUSES).not.toContain('BOOKED')
  })
})

describe('rentalDateOverlapFilter — the crossed-bounds overlap test', () => {
  const start = new Date('2026-06-10')
  const end = new Date('2026-06-15')
  const filter = rentalDateOverlapFilter(start, end)

  /**
   * Two ranges overlap when A.start <= B.end AND A.end >= B.start. The bounds
   * are deliberately CROSSED: the existing rental's startDate is compared to the
   * requested dueDate, and its dueDate to the requested startDate. Comparing
   * start-to-start is the classic mistake and it misses any booking that
   * straddles the requested window.
   */
  it('compares each bound against the opposite end of the requested range', () => {
    expect(filter.startDate).toEqual({ lte: end })
    expect(filter.dueDate).toEqual({ gte: start })
  })

  it('only ever looks at rentals in a blocking status', () => {
    expect(filter.status).toEqual({ in: [...BLOCKING_STATUSES] })
  })

  it('treats a same-day handover as a conflict, since both days are charged', () => {
    // A rental due on the 10th and one starting on the 10th both occupy the 10th.
    const sameDay = rentalDateOverlapFilter(new Date('2026-06-10'), new Date('2026-06-10'))
    expect(sameDay.startDate.lte).toEqual(sameDay.dueDate.gte)
  })
})
