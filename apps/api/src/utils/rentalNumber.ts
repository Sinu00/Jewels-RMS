import { format } from 'date-fns'
import { Prisma } from '@prisma/client'

type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export async function generateRentalNumber(outletId: string, tx: TxClient): Promise<string> {
  const dateStr = format(new Date(), 'yyyyMMdd')
  const prefix = `RNT-${dateStr}-`

  const last = await tx.rental.findFirst({
    where: { outletId, rentalNumber: { startsWith: prefix } },
    orderBy: { rentalNumber: 'desc' },
    select: { rentalNumber: true },
  })

  const lastSeq = last ? parseInt(last.rentalNumber.split('-')[2], 10) : 0
  return `${prefix}${String(lastSeq + 1).padStart(3, '0')}`
}
