/**
 * DEMO seed — rich, realistic data for the marketing video screenshots.
 *
 * DESTRUCTIVE: wipes the target database, then repopulates it. Run ONLY against
 * a local/demo database, never production:
 *   pnpm --filter api exec tsx prisma/seed.demo.ts
 *
 * If jewellery photos are dropped into apps/video/assets/jewelry/ (jpg/png),
 * they are attached to ornaments so inventory cards show real images; otherwise
 * the app's built-in placeholder is used.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads'
const JEWELRY_DIR = path.resolve(__dirname, '../../video/assets/jewelry')

/** Date-only helper relative to today (local time). */
function day(offset: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d
}

const CATEGORIES = [
  'Antique Necklaces',
  'Kundan Sets',
  'Bangles',
  'Earrings',
  'Maang Tikka',
  'Bridal Sets',
]

// name, category, rate/day, weight(g)
const ITEMS: Array<[string, string, number, number]> = [
  ['Royal Antique Choker', 'Antique Necklaces', 1200, 85],
  ['Temple Lakshmi Haram', 'Antique Necklaces', 1500, 120],
  ['Peacock Kundan Set', 'Kundan Sets', 1000, 95],
  ['Emerald Kundan Necklace', 'Kundan Sets', 1100, 78],
  ['Polki Bridal Set', 'Bridal Sets', 2200, 160],
  ['Ruby Bridal Haram', 'Bridal Sets', 2000, 150],
  ['Gold Jhumka Earrings', 'Earrings', 400, 22],
  ['Chandbali Earrings', 'Earrings', 450, 28],
  ['Antique Kada Pair', 'Bangles', 600, 90],
  ['Kundan Bangle Set', 'Bangles', 700, 110],
  ['Pearl Maang Tikka', 'Maang Tikka', 300, 14],
  ['Kundan Matha Patti', 'Maang Tikka', 500, 30],
]

const CUSTOMERS: Array<[string, string]> = [
  ['Priya Nair', '9845012345'],
  ['Ananya Reddy', '9886023456'],
  ['Sneha Iyer', '9740034567'],
  ['Divya Menon', '9844045678'],
  ['Kavya Pillai', '9663056789'],
  ['Meera Krishnan', '9900067890'],
  ['Lakshmi Rao', '9880078901'],
  ['Aishwarya Shetty', '9845089012'],
]

async function wipe() {
  await prisma.payment.deleteMany()
  await prisma.rentalExtension.deleteMany()
  await prisma.rentalItem.deleteMany()
  await prisma.rental.deleteMany()
  await prisma.ornamentImage.deleteMany()
  await prisma.ornament.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()
  // @ts-ignore — itemCodeSequence exists in the schema
  await prisma.itemCodeSequence.deleteMany().catch(() => {})
  await prisma.outlet.deleteMany()
}

function jewelryFiles(): string[] {
  if (!fs.existsSync(JEWELRY_DIR)) return []
  return fs
    .readdirSync(JEWELRY_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
}

async function main() {
  // Refuse to run against production — this seed WIPES the database.
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run the DESTRUCTIVE demo seed with NODE_ENV=production.')
    process.exit(1)
  }
  console.warn('⚠️  DESTRUCTIVE: wiping the local database and reseeding demo data.')
  console.warn('   After this runs, the ONLY login is:  demo@jewels.app / demo123')
  console.warn('   To restore the standard branch users, run:  pnpm --filter api db:seed')

  await wipe()

  const outlet1 = await prisma.outlet.create({
    data: {
      id: 'demo-outlet-1',
      name: 'Jewels — Bandra',
      address: 'Linking Road, Bandra West, Mumbai 400050',
      phone: '9820011111',
      categoriesJson: JSON.stringify(CATEGORIES),
    },
  })
  const outlet2 = await prisma.outlet.create({
    data: {
      id: 'demo-outlet-2',
      name: 'Jewels — Andheri',
      address: 'Lokhandwala, Andheri West, Mumbai 400053',
      phone: '9820022222',
      categoriesJson: JSON.stringify(CATEGORIES),
    },
  })

  const adminHash = await bcrypt.hash('demo123', 12)
  const admin = await prisma.user.create({
    data: {
      outletId: outlet1.id,
      name: 'Anjali Desai',
      email: 'demo@jewels.app',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })
  await prisma.user.create({
    data: {
      outletId: outlet1.id,
      name: 'Rahul Mehta',
      email: 'staff@jewels.app',
      passwordHash: adminHash,
      role: 'STAFF',
    },
  })
  await prisma.user.create({
    data: {
      outletId: outlet2.id,
      name: 'Karan Shah',
      email: 'andheri@jewels.app',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  // Ornaments + optional photos
  const photos = jewelryFiles()
  const codeCount: Record<string, number> = {}
  // Track the last sequence number used per (outletId, prefix) so we can prime
  // the itemCodeSequence table — otherwise the app restarts each counter at 1
  // and the first new item collides with a seeded itemCode.
  const seqUsed: Record<string, number> = {}
  const ornaments = []
  for (let i = 0; i < ITEMS.length; i++) {
    const [name, category, rate, weight] = ITEMS[i]
    const prefix = category.slice(0, 3).toUpperCase()
    codeCount[prefix] = (codeCount[prefix] ?? 0) + 1
    seqUsed[`${outlet1.id}:${prefix}`] = codeCount[prefix]
    const itemCode = `${prefix}${String(codeCount[prefix]).padStart(4, '0')}`
    const orn = await prisma.ornament.create({
      data: {
        outletId: outlet1.id,
        itemCode,
        name,
        category,
        weightGrams: weight,
        baseRatePerDay: rate,
        description: `${name} — premium rental piece.`,
      },
    })
    ornaments.push(orn)

    // Attach a photo if available (cycle through provided images).
    if (photos.length) {
      const src = path.join(JEWELRY_DIR, photos[i % photos.length])
      const ext = path.extname(src).toLowerCase()
      const destDir = path.join(UPLOAD_DIR, 'ornaments', orn.id)
      fs.mkdirSync(destDir, { recursive: true })
      const fileName = `demo${ext}`
      fs.copyFileSync(src, path.join(destDir, fileName))
      await prisma.ornamentImage.create({
        data: {
          ornamentId: orn.id,
          filePath: `ornaments/${orn.id}/${fileName}`,
          displayOrder: 0,
        },
      })
    }
  }

  // A couple of ornaments for outlet 2 (multi-branch realism)
  for (const [name, category, rate, weight] of ITEMS.slice(0, 4)) {
    const prefix = category.slice(0, 3).toUpperCase()
    codeCount[prefix] = (codeCount[prefix] ?? 0) + 1
    seqUsed[`${outlet2.id}:${prefix}`] = codeCount[prefix]
    await prisma.ornament.create({
      data: {
        outletId: outlet2.id,
        itemCode: `${prefix}${String(codeCount[prefix]).padStart(4, '0')}`,
        name,
        category,
        weightGrams: weight,
        baseRatePerDay: rate,
      },
    })
  }

  // Prime the per-(prefix, outlet) item-code counters so the next item added in
  // the app continues the sequence instead of colliding with a seeded code.
  for (const [key, lastSeq] of Object.entries(seqUsed)) {
    const [outletId, prefix] = key.split(':')
    await prisma.itemCodeSequence.upsert({
      where: { prefix_outletId: { prefix, outletId } },
      update: { lastSeq },
      create: { prefix, outletId, lastSeq },
    })
  }

  // Customers (outlet 1)
  const customers = []
  for (const [name, phone] of CUSTOMERS) {
    customers.push(
      await prisma.customer.create({
        data: { outletId: outlet1.id, name, phone, address: 'Mumbai' },
      })
    )
  }

  // ---- Rentals across every status, dated around "today" ----
  let rentalSeq = 0
  const rentalNo = () => `R${String(++rentalSeq).padStart(4, '0')}`

  async function makeRental(opts: {
    customerIdx: number
    itemIdxs: number[]
    status: 'BOOKED' | 'ACTIVE' | 'OVERDUE' | 'EXTENDED' | 'RETURNED'
    start: number // day offset
    due: number // day offset
    deposit: number
    plan?: 'FULL_UPFRONT' | 'HALF_ADVANCE' | 'FULL_RENT_DEFER_DEPOSIT'
  }) {
    const plan = opts.plan ?? 'FULL_UPFRONT'
    const items = opts.itemIdxs.map((i) => ornaments[i])
    const days = Math.max(1, opts.due - opts.start)
    const total = items.reduce((s, o) => s + Number(o.baseRatePerDay) * days, 0)
    const isOut = opts.status === 'ACTIVE' || opts.status === 'OVERDUE' || opts.status === 'EXTENDED'
    const isReturned = opts.status === 'RETURNED'
    const depositCollected = isOut || isReturned
    const r = await prisma.rental.create({
      data: {
        outletId: outlet1.id,
        customerId: customers[opts.customerIdx].id,
        rentalNumber: rentalNo(),
        status: opts.status,
        paymentPlan: plan,
        totalRentalAmount: total,
        startDate: day(opts.start),
        dueDate: day(opts.due),
        depositAmount: opts.deposit,
        depositCollected,
        depositRefunded: isReturned,
        returnedAt: isReturned ? day(opts.due) : null,
        items: { create: items.map((o) => ({ ornamentId: o.id, ratePerDay: o.baseRatePerDay })) },
      },
    })
    // Payments: rent collected for out/returned; deposit collected + refunded for returned.
    const pay = (type: any, amount: number, offset: number) =>
      prisma.payment.create({
        data: {
          outletId: outlet1.id,
          rentalId: r.id,
          recordedById: admin.id,
          type,
          method: 'CASH',
          amount,
          createdAt: new Date(day(offset).getTime() + 11 * 3600 * 1000),
        },
      })
    if (isOut || isReturned) {
      await pay('RENTAL', total, opts.start)
      await pay('DEPOSIT', opts.deposit, opts.start)
    }
    if (isReturned) await pay('DEPOSIT_REFUND', opts.deposit, opts.due)
    return r
  }

  // Bookings (future pickups) incl. one for today
  await makeRental({ customerIdx: 0, itemIdxs: [4], status: 'BOOKED', start: 0, due: 3, deposit: 5000 })
  await makeRental({ customerIdx: 1, itemIdxs: [0, 6], status: 'BOOKED', start: 2, due: 5, deposit: 3000 })
  // Active (out now)
  await makeRental({ customerIdx: 2, itemIdxs: [2], status: 'ACTIVE', start: -2, due: 2, deposit: 3000 })
  await makeRental({ customerIdx: 3, itemIdxs: [8, 10], status: 'ACTIVE', start: -1, due: 1, deposit: 2500 })
  // Due today
  await makeRental({ customerIdx: 4, itemIdxs: [7], status: 'ACTIVE', start: -3, due: 0, deposit: 2000 })
  // Overdue
  await makeRental({ customerIdx: 5, itemIdxs: [1], status: 'OVERDUE', start: -6, due: -2, deposit: 6000 })
  // Extended
  const ext = await makeRental({ customerIdx: 6, itemIdxs: [3], status: 'EXTENDED', start: -4, due: 4, deposit: 3000 })
  await prisma.rentalExtension.create({
    data: {
      rentalId: ext.id,
      previousDueDate: day(1),
      newDueDate: day(4),
      amount: 3300,
      reason: 'Customer requested 3 more days',
    },
  })
  await prisma.payment.create({
    data: { outletId: outlet1.id, rentalId: ext.id, recordedById: admin.id, type: 'RENTAL', method: 'UPI', amount: 3300, note: 'Extension +3 days', createdAt: day(0) },
  })
  // Returned (history + refund)
  await makeRental({ customerIdx: 7, itemIdxs: [5], status: 'RETURNED', start: -10, due: -5, deposit: 7000 })
  await makeRental({ customerIdx: 0, itemIdxs: [9], status: 'RETURNED', start: -8, due: -4, deposit: 2500 })

  console.log('Demo data seeded.')
  console.log('  Login: demo@jewels.app / demo123  (Jewels — Bandra)')
  console.log(`  ${ornaments.length} ornaments, ${customers.length} customers, ${rentalSeq} rentals`)
  console.log(photos.length ? `  Attached ${photos.length} jewellery photo(s).` : '  No photos found — using placeholders.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
