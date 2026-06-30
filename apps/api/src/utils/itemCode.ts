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

  // itemCode is unique per outlet, and the sequence is per (prefix, outlet). A
  // candidate can still be taken within this outlet — e.g. by seeded data the
  // sequence wasn't primed for. Advance the sequence until we land on a code
  // that's free for THIS outlet instead of throwing a unique-constraint error
  // (P2002) on insert. Other outlets reusing the same code is fine.
  for (let attempt = 0; attempt < 10000; attempt++) {
    const seq = await tx.itemCodeSequence.upsert({
      where: { prefix_outletId: { prefix, outletId } },
      update: { lastSeq: { increment: 1 } },
      create: { prefix, outletId, lastSeq: 1 },
      select: { lastSeq: true },
    })

    const code = `${prefix}${String(seq.lastSeq).padStart(4, '0')}`
    const taken = await tx.ornament.findFirst({
      where: { outletId, itemCode: code },
      select: { id: true },
    })
    if (!taken) return code
  }

  throw new Error(`Unable to generate a unique item code for prefix ${prefix}`)
}
