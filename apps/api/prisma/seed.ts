import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const outlet1 = await prisma.outlet.upsert({
    where: { id: 'outlet-branch-1' },
    update: {},
    create: {
      id: 'outlet-branch-1',
      name: 'Shree Jewels — MG Road',
      address: '42 MG Road, Bangalore 560001',
      phone: '9180001234',
    },
  })

  const outlet2 = await prisma.outlet.upsert({
    where: { id: 'outlet-branch-2' },
    update: {},
    create: {
      id: 'outlet-branch-2',
      name: 'Shree Jewels — Indiranagar',
      address: '15 100 Feet Road, Indiranagar, Bangalore 560038',
      phone: '9180005678',
    },
  })

  const adminHash = await bcrypt.hash('admin123', 12)
  const staffHash = await bcrypt.hash('staff123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@branch1.com' },
    update: {},
    create: {
      outletId: outlet1.id,
      name: 'Ravi Kumar',
      email: 'admin@branch1.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'staff@branch1.com' },
    update: {},
    create: {
      outletId: outlet1.id,
      name: 'Priya Sharma',
      email: 'staff@branch1.com',
      passwordHash: staffHash,
      role: 'STAFF',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@branch2.com' },
    update: {},
    create: {
      outletId: outlet2.id,
      name: 'Suresh Patel',
      email: 'admin@branch2.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  console.log('Seeded:')
  console.log('  Branch 1 Admin: admin@branch1.com / admin123')
  console.log('  Branch 1 Staff: staff@branch1.com / staff123')
  console.log('  Branch 2 Admin: admin@branch2.com / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
