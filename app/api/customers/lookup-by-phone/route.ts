import {
  lookupCustomerByPhone,
  type LookupCustomerResult,
} from '@/Lib/lookupCustomerByPhone'
import type { CustomerRecord } from '@/Lib/findOrCreateCustomerByPhone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  let body: { phone?: string }

  try {
    body = (await request.json()) as { phone?: string }
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const phone = body.phone?.trim() ?? ''
  if (!phone) {
    return Response.json({ error: 'Informe o telefone.' }, { status: 400 })
  }

  const result: LookupCustomerResult = await lookupCustomerByPhone(phone)

  if (result.error) {
    return Response.json(
      { error: result.error.message },
      { status: result.error.message.includes('inválido') ? 400 : 500 },
    )
  }

  return Response.json(
    {
      customer: (result.customer as CustomerRecord | null) ?? null,
      found: Boolean(result.customer),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}
