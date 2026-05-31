import { Router, Request, Response } from 'express'
import { startOfDay } from 'date-fns'
import { PaymentMethod, PaymentPlan } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { generateRentalNumber } from '../utils/rentalNumber'
import { ACTIVE_STATUSES, getConflictingOrnamentIds } from '../utils/availability'
import { dateOnlyRange } from '../utils/dateOnly'
import { updateOverdueRentals } from '../utils/updateOverdueRentals'
import { calculateRentalDays, calculateDaysOverdue } from '../utils/rentalCalc'
import {
  bookingPaymentsToCreate,
  computePickupDue,
  depositPaidAmount,
  pickupPaymentsToCreate,
  rentalPaidAmount,
} from '../utils/rentalPayments'

const router = Router()
router.use(requireAuth)

function mapRentalSummary(r: any): object {
  const totalRentalAmount = Number(r.totalRentalAmount)
  return {
    id: r.id,
    rentalNumber: r.rentalNumber,
    customerId: r.customerId,
    customerName: r.customer.name,
    status: r.status,
    paymentPlan: r.paymentPlan,
    startDate: r.startDate,
    dueDate: r.dueDate,
    itemsCount: r.items.length,
    depositAmount: Number(r.depositAmount),
    totalRentalAmount,
    daysOverdue: calculateDaysOverdue(r.dueDate, r.status),
    createdAt: r.createdAt,
  }
}

function mapRentalDetail(r: any): object {
  const days = calculateRentalDays(r.startDate, r.dueDate)
  const totalRentalAmount = Number(r.totalRentalAmount)
  const rentalPaid = rentalPaidAmount(r.payments)
  const depositPaid = depositPaidAmount(r.payments)
  const { rentalDue, depositDue } = computePickupDue(
    r.paymentPlan,
    totalRentalAmount,
    Number(r.depositAmount),
    rentalPaid,
    depositPaid
  )

  const items = r.items.map((item: any) => ({
    id: item.id,
    ornamentId: item.ornamentId,
    ornament: {
      id: item.ornament.id,
      itemCode: item.ornament.itemCode,
      name: item.ornament.name,
      category: item.ornament.category,
      images: item.ornament.images.map((img: any) => ({
        id: img.id,
        url: `${process.env.BASE_URL ?? 'http://localhost:3001'}/uploads/${img.filePath}`,
        displayOrder: img.displayOrder,
      })),
    },
    ratePerDay: Number(item.ratePerDay),
    totalAmount: Number(item.ratePerDay) * days,
  }))

  const today = startOfDay(new Date())
  const pickupDate = startOfDay(new Date(r.startDate))
  const needsPickupPayment = rentalDue > 0 || depositDue > 0
  const pickupDateReached = pickupDate.getTime() <= today.getTime()
  const canPickup = r.status === 'BOOKED' && pickupDateReached

  return {
    id: r.id,
    rentalNumber: r.rentalNumber,
    outletId: r.outletId,
    customerId: r.customerId,
    customer: { id: r.customer.id, name: r.customer.name, phone: r.customer.phone },
    status: r.status,
    paymentPlan: r.paymentPlan,
    startDate: r.startDate,
    dueDate: r.dueDate,
    returnedAt: r.returnedAt,
    depositAmount: Number(r.depositAmount),
    depositCollected: r.depositCollected,
    depositRefunded: r.depositRefunded,
    notes: r.notes,
    items,
    totalRentalAmount,
    rentalPaid,
    rentalDue,
    depositDue,
    amountDueOnPickup: rentalDue + depositDue,
    canPickup,
    needsPickupPayment,
    extensions: r.extensions.map((e: any) => ({
      id: e.id,
      rentalId: e.rentalId,
      previousDueDate: e.previousDueDate,
      newDueDate: e.newDueDate,
      reason: e.reason,
      createdAt: e.createdAt,
    })),
    payments: r.payments.map((p: any) => ({
      id: p.id,
      outletId: p.outletId,
      rentalId: p.rentalId,
      type: p.type,
      method: p.method,
      amount: Number(p.amount),
      note: p.note,
      createdAt: p.createdAt,
      recordedBy: { id: p.recordedBy.id, name: p.recordedBy.name },
    })),
    daysOverdue: calculateDaysOverdue(r.dueDate, r.status),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

const rentalDetailInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  items: {
    include: {
      ornament: {
        include: { images: { orderBy: { displayOrder: 'asc' as const } } },
      },
    },
  },
  extensions: { orderBy: { createdAt: 'asc' as const } },
  payments: {
    include: { recordedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
}

// GET /rentals
router.get('/', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { status, search, dueDate, startDate, outOnly, page = '1', limit = '20' } = req.query as Record<string, string>

  await updateOverdueRentals(outletId)

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const where: any = { outletId }
  if (outOnly === 'true') {
    where.status = { in: [...ACTIVE_STATUSES] }
  } else if (status) {
    where.status = status
  }
  if (dueDate) {
    where.dueDate = dateOnlyRange(dueDate)
  }
  if (startDate) {
    where.startDate = dateOnlyRange(startDate)
  }
  if (search) {
    where.OR = [
      { rentalNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [rentals, total] = await Promise.all([
    prisma.rental.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        items: { select: { ratePerDay: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.rental.count({ where }),
  ])

  res.json({
    data: rentals.map(mapRentalSummary),
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
})

// POST /rentals — create booking
router.post('/', async (req: Request, res: Response) => {
  const { outletId, id: userId } = (req as AuthRequest).user
  const {
    customerId,
    startDate,
    dueDate,
    depositAmount,
    paymentMethod,
    paymentPlan = 'FULL_UPFRONT',
    notes,
    items,
    autoPickup,
  } = req.body

  if (!customerId || !startDate || !dueDate || depositAmount === undefined || !paymentMethod || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const validPlans: PaymentPlan[] = ['HALF_ADVANCE', 'FULL_RENT_DEFER_DEPOSIT', 'FULL_UPFRONT']
  if (!validPlans.includes(paymentPlan)) {
    return res.status(400).json({ error: 'Invalid payment plan' })
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, outletId, isDeleted: false },
  })
  if (!customer) return res.status(400).json({ error: 'Customer not found' })

  const rangeStart = new Date(startDate)
  const rangeEnd = new Date(dueDate)
  if (rangeEnd < rangeStart) {
    return res.status(400).json({ error: 'Return date must be on or after pickup date' })
  }

  const ornamentIds: string[] = items.map((i: any) => i.ornamentId)
  const conflicts = await getConflictingOrnamentIds(ornamentIds, rangeStart, rangeEnd)
  if (conflicts.length > 0) {
    return res.status(400).json({
      error: 'One or more ornaments are not available for the selected dates',
      conflicts,
    })
  }

  const rentalDays = calculateRentalDays(startDate, dueDate)
  const totalRentalAmount = items.reduce(
    (sum: number, item: any) => sum + Number(item.ratePerDay) * rentalDays,
    0
  )

  const bookingPayments = bookingPaymentsToCreate({
    paymentPlan,
    totalRentalAmount,
    depositAmount: Number(depositAmount),
    method: paymentMethod,
  })

  const depositCollectedAtBooking = bookingPayments.some((p) => p.type === 'DEPOSIT')
  const today = startOfDay(new Date())
  const pickupDay = startOfDay(rangeStart)
  const shouldAutoPickup =
    autoPickup === true ||
    (paymentPlan === 'FULL_UPFRONT' &&
      depositCollectedAtBooking &&
      pickupDay.getTime() <= today.getTime())

  const fullRental = await prisma.$transaction(async (tx) => {
    const rentalNumber = await generateRentalNumber(outletId, tx)
    const newRental = await tx.rental.create({
      data: {
        outletId,
        customerId,
        rentalNumber,
        status: shouldAutoPickup ? 'ACTIVE' : 'BOOKED',
        paymentPlan,
        totalRentalAmount,
        startDate: rangeStart,
        dueDate: rangeEnd,
        depositAmount,
        depositCollected: depositCollectedAtBooking,
        notes: notes ?? null,
        items: {
          create: items.map((item: any) => ({
            ornamentId: item.ornamentId,
            ratePerDay: item.ratePerDay,
          })),
        },
      },
    })

    for (const p of bookingPayments) {
      await tx.payment.create({
        data: {
          outletId,
          rentalId: newRental.id,
          recordedById: userId,
          type: p.type,
          method: paymentMethod as PaymentMethod,
          amount: p.amount,
        },
      })
    }

    return tx.rental.findUnique({ where: { id: newRental.id }, include: rentalDetailInclude })
  })

  res.status(201).json(mapRentalDetail(fullRental))
})

// GET /rentals/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const rental = await prisma.rental.findFirst({
    where: { id: req.params.id, outletId },
    include: rentalDetailInclude,
  })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  res.json(mapRentalDetail(rental))
})

// POST /rentals/:id/pickup
router.post('/:id/pickup', async (req: Request, res: Response) => {
  const { outletId, id: userId } = (req as AuthRequest).user
  const { method } = req.body

  if (!method) return res.status(400).json({ error: 'method required' })

  const rental = await prisma.rental.findFirst({
    where: { id: req.params.id, outletId },
    include: { payments: true },
  })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.status !== 'BOOKED') {
    return res.status(400).json({ error: 'Only booked rentals can be picked up' })
  }

  const today = startOfDay(new Date())
  const pickupDay = startOfDay(new Date(rental.startDate))
  if (pickupDay.getTime() > today.getTime()) {
    return res.status(400).json({ error: 'Pickup is only allowed on or after the pickup date' })
  }

  const totalRentalAmount = Number(rental.totalRentalAmount)
  const depositAmount = Number(rental.depositAmount)
  const rentalPaid = rentalPaidAmount(rental.payments)
  const depositPaid = depositPaidAmount(rental.payments)
  const { rentalDue, depositDue } = computePickupDue(
    rental.paymentPlan,
    totalRentalAmount,
    depositAmount,
    rentalPaid,
    depositPaid
  )

  const pickupPayments = pickupPaymentsToCreate(rental.paymentPlan, rentalDue, depositDue)

  await prisma.$transaction(async (tx) => {
    for (const p of pickupPayments) {
      await tx.payment.create({
        data: {
          outletId,
          rentalId: rental.id,
          recordedById: userId,
          type: p.type,
          method: method as PaymentMethod,
          amount: p.amount,
        },
      })
    }
    await tx.rental.update({
      where: { id: rental.id },
      data: {
        status: 'ACTIVE',
        depositCollected: rental.depositCollected || depositDue > 0 || depositPaid >= depositAmount,
      },
    })
  })

  const updated = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalDetailInclude,
  })
  res.json(mapRentalDetail(updated))
})

// POST /rentals/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { note } = req.body

  const rental = await prisma.rental.findFirst({ where: { id: req.params.id, outletId } })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.status !== 'BOOKED') {
    return res.status(400).json({ error: 'Only booked rentals can be cancelled' })
  }

  await prisma.rental.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', notes: note ? `${rental.notes ?? ''}\nCancelled: ${note}`.trim() : rental.notes },
  })

  const updated = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalDetailInclude,
  })
  res.json(mapRentalDetail(updated))
})

// POST /rentals/:id/return
router.post('/:id/return', async (req: Request, res: Response) => {
  const { outletId, id: userId } = (req as AuthRequest).user
  const { method, note } = req.body

  if (!method) return res.status(400).json({ error: 'method required' })

  const rental = await prisma.rental.findFirst({ where: { id: req.params.id, outletId } })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.status === 'RETURNED') return res.status(400).json({ error: 'Rental already returned' })
  if (rental.status === 'BOOKED' || rental.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot return a booking that has not been picked up' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.rental.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED', returnedAt: new Date(), depositRefunded: rental.depositCollected },
    })
    if (rental.depositCollected) {
      await tx.payment.create({
        data: {
          outletId,
          rentalId: req.params.id,
          recordedById: userId,
          type: 'DEPOSIT_REFUND',
          method,
          amount: rental.depositAmount,
          note: note ?? null,
        },
      })
    }
  })

  const updated = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalDetailInclude,
  })
  res.json(mapRentalDetail(updated))
})

// POST /rentals/:id/extend
router.post('/:id/extend', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { newDueDate, reason } = req.body

  if (!newDueDate) return res.status(400).json({ error: 'newDueDate required' })

  const rental = await prisma.rental.findFirst({ where: { id: req.params.id, outletId } })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.status === 'RETURNED' || rental.status === 'BOOKED' || rental.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot extend this rental' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.rentalExtension.create({
      data: {
        rentalId: req.params.id,
        previousDueDate: rental.dueDate,
        newDueDate: new Date(newDueDate),
        reason: reason ?? null,
      },
    })
    await tx.rental.update({
      where: { id: req.params.id },
      data: { dueDate: new Date(newDueDate), status: 'EXTENDED' },
    })
  })

  const updated = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalDetailInclude,
  })
  res.json(mapRentalDetail(updated))
})

// POST /rentals/:id/reschedule — change a booking's pickup/return dates
router.post('/:id/reschedule', async (req: Request, res: Response) => {
  const { outletId } = (req as AuthRequest).user
  const { startDate, dueDate, totalRentalAmount } = req.body

  if (!startDate || !dueDate) {
    return res.status(400).json({ error: 'startDate and dueDate required' })
  }

  const rental = await prisma.rental.findFirst({
    where: { id: req.params.id, outletId },
    include: { items: true },
  })
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.status !== 'BOOKED') {
    return res.status(400).json({ error: 'Only bookings can be rescheduled' })
  }

  const rangeStart = new Date(startDate)
  const rangeEnd = new Date(dueDate)
  if (rangeEnd < rangeStart) {
    return res.status(400).json({ error: 'Return date must be on or after pickup date' })
  }

  // Re-check availability for the new dates, ignoring this rental's own items.
  const ornamentIds = rental.items.map((i) => i.ornamentId)
  const conflicts = await getConflictingOrnamentIds(ornamentIds, rangeStart, rangeEnd, rental.id)
  if (conflicts.length > 0) {
    return res.status(400).json({
      error: 'One or more ornaments are not available for the selected dates',
      conflicts,
    })
  }

  // Recompute rent for the new duration; allow a manual override from the caller.
  const rentalDays = calculateRentalDays(startDate, dueDate)
  const computedTotal = rental.items.reduce(
    (sum, item) => sum + Number(item.ratePerDay) * rentalDays,
    0
  )
  const finalTotal =
    totalRentalAmount !== undefined && totalRentalAmount !== null && Number(totalRentalAmount) >= 0
      ? Number(totalRentalAmount)
      : computedTotal

  await prisma.rental.update({
    where: { id: rental.id },
    data: { startDate: rangeStart, dueDate: rangeEnd, totalRentalAmount: finalTotal },
  })

  const updated = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalDetailInclude,
  })
  res.json(mapRentalDetail(updated))
})

export default router
