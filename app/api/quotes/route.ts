import { buildQuoteSavePayload, type QuoteSaveInput } from '@/Lib/buildQuoteSavePayload'
import { supabase } from '@/Lib/supabase'

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

  const payload = buildQuoteSavePayload(body)

  const { data, error } = await supabase
    .from('quotes')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[CDL Quote] Supabase insert failed:', error.message, payload)
    return Response.json(
      { error: 'Erro ao gravar cotação no Supabase.' },
      { status: 500 },
    )
  }

  const quoteId = data.id as string

  if (body.additionals.length > 0) {
    const lines = body.additionals.map((line) => ({
      quote_id: quoteId,
      additional_item_id: line.itemId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      total_price: line.totalPrice,
    }))

    const { error: linesError } = await supabase
      .from('quote_additional_items')
      .insert(lines)

    if (linesError) {
      console.error(
        '[CDL Quote] Supabase quote_additional_items insert failed:',
        linesError.message,
        lines,
      )
    }
  }

  return Response.json({ id: quoteId })
}
