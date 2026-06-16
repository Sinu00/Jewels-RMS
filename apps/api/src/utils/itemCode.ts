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

  // itemCode is globally unique, but the sequence is per (prefix, outlet), so a
  // candidate can already be taken — by another branch with the same prefix, or
  // by seeded data the sequence wasn't primed for. Advance the sequence until we
  // land on a code that's actually free instead of throwing a unique-constraint
  // error (P2002) on insert.
  for (let attempt = 0; attempt < 10000; attempt++) {
    const seq = await tx.itemCodeSequence.upsert({
      where: { prefix_outletId: { prefix, outletId } },
      update: { lastSeq: { increment: 1 } },
      create: { prefix, outletId, lastSeq: 1 },
      select: { lastSeq: true },
    })

    const code = `${prefix}${String(seq.lastSeq).padStart(4, '0')}`
    const taken = await tx.ornament.findUnique({
      where: { itemCode: code },
      select: { id: true },
    })
    if (!taken) return code
  }

  throw new Error(`Unable to generate a unique item code for prefix ${prefix}`)
}
