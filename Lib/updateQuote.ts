import {
  buildAdditionalItemRows,
  buildQuoteSavePayload,
  type QuoteSaveInput,
} from './buildQuoteSavePayload'
import { supabase } from './supabase'

export async function updateQuote(quoteId: string, input: QuoteSaveInput) {
  const payload = buildQuoteSavePayload(input, { mode: 'update' })

  const { error: updateError } = await supabase
    .from('quotes')
    .update(payload)
    .eq('id', quoteId)
    .eq('active', true)

  if (updateError) {
    console.error('[CDL Quote] updateQuote failed:', updateError.message, payload)
    return { data: null, error: updateError }
  }

  const { error: deleteError } = await supabase
    .from('quote_additional_items')
    .delete()
    .eq('quote_id', quoteId)

  if (deleteError) {
    console.error(
      '[CDL Quote] updateQuote delete additionals failed:',
      deleteError.message,
    )
    return { data: null, error: deleteError }
  }

  if (input.additionals.length > 0) {
    const lines = buildAdditionalItemRows(quoteId, input.additionals)
    const { error: linesError } = await supabase
      .from('quote_additional_items')
      .insert(lines)

    if (linesError) {
      console.error(
        '[CDL Quote] updateQuote insert additionals failed:',
        linesError.message,
        lines,
      )
      return { data: null, error: linesError }
    }
  }

  return { data: { id: quoteId }, error: null }
}
