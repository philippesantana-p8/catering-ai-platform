import { createQuote } from '@/Lib/createQuote'
import type { QuoteSaveInput } from '@/Lib/buildQuoteSavePayload'
import { logSaveQuoteError } from '@/Lib/supabaseSaveError'

export async function POST(request: Request) {
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

  const { data, error } = await createQuote(body)

  if (error || !data?.id) {
    if (error) logSaveQuoteError(error)
    return Response.json(
      {
        error: error?.message ?? 'Erro ao gravar cotação no Supabase.',
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
        stage: error?.stage ?? null,
      },
      { status: 500 },
    )
  }

  return Response.json({ id: data.id, quote_number: data.quote_number })
}
