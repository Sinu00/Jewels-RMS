import { format } from 'date-fns'
import { Prisma } from '@prisma/client'

type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export async function generateRentalNumber(tx: TxClient): Promise<string> {
  const dateStr = format(new Date(), 'yyyyMMdd')
  const prefix = `RNT-${dateStr}-`

  // rentalNumber is GLOBALLY unique, so the daily counter must look across ALL
  // outlets, not per-outlet. (Per-outlet made a second branch regenerate 001 and
  // clash with the first branch's 001 → "That record already exists" in prod.)
  const last = await tx.rental.findFirst({
    where: { rentalNumber: { startsWith: prefix } },
    orderBy: { rentalNumber: 'desc' },
    select: { rentalNumber: true },
  })

  const lastSeq = last ? parseInt(last.rentalNumber.split('-')[2], 10) : 0
  return `${prefix}${String(lastSeq + 1).padStart(3, '0')}`
}
