import { Prisma } from '@prisma/client'

type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export async function generateItemCode(
  outletId: string,
  category: string,
  tx: TxClient
): Promise<string> {
  const prefix = category.slice(0, 3).toUpperCase()

  const seq = await tx.itemCodeSequence.upsert({
    where: { prefix_outletId: { prefix, outletId } },
    update: { lastSeq: { increment: 1 } },
    create: { prefix, outletId, lastSeq: 1 },
    select: { lastSeq: true },
  })

  return `${prefix}${String(seq.lastSeq).padStart(4, '0')}`
}
