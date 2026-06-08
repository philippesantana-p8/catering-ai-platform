import {
  findOrCreateCustomerByPhone,
  type CustomerRecord,
} from '@/Lib/findOrCreateCustomerByPhone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Cria ou vincula cliente por telefone — usado no save final da cotação. */
export async function POST(request: Request) {
  let body: { phone?: string; name?: string | null; email?: string | null }

  try {
    body = (await request.json()) as {
      phone?: string
      name?: string | null
      email?: string | null
    }
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const phone = body.phone?.trim() ?? ''
  if (!phone) {
    return Response.json({ error: 'Informe o telefone.' }, { status: 400 })
  }

  const { customer, created, error } = await findOrCreateCustomerByPhone({
    phone,
    name: body.name,
    email: body.email,
  })

  if (error || !customer) {
    return Response.json(
      { error: error?.message ?? 'Cliente não encontrado nem criado.' },
      { status: error?.message.includes('inválido') ? 400 : 500 },
    )
  }

  return Response.json(
    {
      customer: customer as CustomerRecord,
      created,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}
