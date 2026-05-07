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

  const result = await tx.$queryRaw<Array<{ last_seq: number }>>`
    INSERT INTO item_code_sequences (id, prefix, outlet_id, last_seq)
    VALUES (gen_random_uuid()::text, ${prefix}, ${outletId}, 1)
    ON CONFLICT (prefix, outlet_id)
    DO UPDATE SET last_seq = item_code_sequences.last_seq + 1
    RETURNING last_seq
  `

  const seq = Number(result[0].last_seq)
  return `${prefix}${String(seq).padStart(4, '0')}`
}
