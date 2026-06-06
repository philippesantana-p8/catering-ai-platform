import type { QuoteSaveInput } from '@/Lib/buildQuoteSavePayload'
import { updateQuote } from '@/Lib/updateQuote'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  let body: QuoteSaveInput

  try {
    body = (await request.json()) as QuoteSaveInput
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  if (!body.customerId || !body.packageId) {
    return Response.json(
      { error: 'Cliente e pacote são obrigatórios.' },
      { status: 400 },
    )
  }

  const { data, error } = await updateQuote(id, body)

  if (error || !data?.id) {
    return Response.json(
      { error: 'Erro ao atualizar cotação no Supabase.' },
      { status: 500 },
    )
  }

  return Response.json({ id: data.id })
}
