import {
  buildAdditionalItemRows,
  buildQuoteSavePayload,
  type QuoteSaveInput,
} from './buildQuoteSavePayload'
import { supabase } from './supabase'

export async function createQuote(input: QuoteSaveInput) {
  const payload = buildQuoteSavePayload(input, { mode: 'create' })

  const { data, error } = await supabase
    .from('quotes')
    .insert(payload)
    .select('id, quote_number')
    .single()

  if (error || !data?.id) {
    console.error('[CDL Quote] createQuote insert failed:', error?.message, payload)
    return {
      data: null,
      error: error ?? new Error('Cotação não foi criada.'),
    }
  }

  const quoteId = data.id as string

  if (input.additionals.length > 0) {
    const lines = buildAdditionalItemRows(quoteId, input.additionals)
    const { error: linesError } = await supabase
      .from('quote_additional_items')
      .insert(lines)

    if (linesError) {
      console.error(
        '[CDL Quote] createQuote additional items failed:',
        linesError.message,
        lines,
      )
      await supabase.from('quotes').delete().eq('id', quoteId)
      return { data: null, error: linesError }
    }
  }

  return {
    data: { id: quoteId, quote_number: data.quote_number as string | null },
    error: null,
  }
}
