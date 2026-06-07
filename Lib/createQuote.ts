import {
  buildAdditionalItemRows,
  buildEventSavePayload,
  buildQuoteSavePayload,
  type QuoteSaveInput,
} from './buildQuoteSavePayload'
import { getCdlCompanyId } from './cdlCompany'
import { getNextQuoteNumber } from './getNextDocumentNumber'
import {
  buildSaveQuoteError,
  logSaveQuoteError,
  type SaveQuoteErrorInfo,
} from './supabaseSaveError'
import { supabase } from './supabase'

export type CreateQuoteResult = {
  data: { id: string; quote_number: string | null } | null
  error: SaveQuoteErrorInfo | null
}

function validateSaveInput(input: QuoteSaveInput): SaveQuoteErrorInfo | null {
  const companyId = getCdlCompanyId()
  if (!input.packageId?.trim()) {
    return buildSaveQuoteError('validation', new Error('package_id vazio.'))
  }
  if (!companyId?.trim()) {
    return buildSaveQuoteError('validation', new Error('company_id vazio.'))
  }
  return null
}

export async function createQuote(input: QuoteSaveInput): Promise<CreateQuoteResult> {
  const validationError = validateSaveInput(input)
  if (validationError) {
    logSaveQuoteError(validationError)
    return { data: null, error: validationError }
  }

  const companyId = getCdlCompanyId()
  const { number: quoteNumber, error: numberError } =
    await getNextQuoteNumber(companyId)

  if (numberError || !quoteNumber) {
    const errorInfo = buildSaveQuoteError(
      'quote',
      new Error(
        numberError?.message ??
          'Não foi possível gerar quote_number via get_next_document_number.',
      ),
    )
    if (numberError?.details) {
      errorInfo.details = numberError.details
    }
    logSaveQuoteError(errorInfo)
    return { data: null, error: errorInfo }
  }

  const eventPayload = buildEventSavePayload(input)

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .insert(eventPayload)
    .select('id')
    .single()

  if (eventError || !eventData?.id) {
    const errorInfo = buildSaveQuoteError(
      'event',
      eventError ??
        new Error(
          'Insert em events não retornou id. Possível RLS, coluna inválida ou FK ausente.',
        ),
      { eventPayload },
    )
    logSaveQuoteError(errorInfo, eventError)
    return { data: null, error: errorInfo }
  }

  const eventId = eventData.id as string
  const quotePayload = {
    ...buildQuoteSavePayload(input, {
      mode: 'create',
      eventId,
    }),
    quote_number: quoteNumber,
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert(quotePayload)
    .select('id, quote_number')
    .single()

  if (error || !data?.id) {
    const errorInfo = buildSaveQuoteError(
      'quote',
      error ??
        new Error(
          'Insert em quotes não retornou id. Possível RLS, coluna inválida ou event_id ausente.',
        ),
      {
        eventPayload,
        quotePayload,
      },
    )
    logSaveQuoteError(errorInfo, error)
    await supabase.from('events').delete().eq('id', eventId)
    return { data: null, error: errorInfo }
  }

  const quoteId = data.id as string

  if (input.additionals.length === 0) {
    return {
      data: { id: quoteId, quote_number: data.quote_number as string | null },
      error: null,
    }
  }

  let additionalItemsPayload: ReturnType<typeof buildAdditionalItemRows>
  try {
    additionalItemsPayload = buildAdditionalItemRows(
      quoteId,
      companyId,
      input.additionals,
    )
  } catch (error) {
    const errorInfo = buildSaveQuoteError('additionals', error, {
      eventPayload,
      quotePayload,
    })
    logSaveQuoteError(errorInfo, error)
    await supabase.from('quotes').delete().eq('id', quoteId)
    await supabase.from('events').delete().eq('id', eventId)
    return { data: null, error: errorInfo }
  }

  const { error: linesError } = await supabase
    .from('quote_additional_items')
    .insert(additionalItemsPayload)

  if (linesError) {
    const errorInfo = buildSaveQuoteError('additionals', linesError, {
      eventPayload,
      quotePayload,
      additionalItemsPayload,
    })
    errorInfo.message = `Cotação ${quoteId} criada, mas falhou ao salvar adicionais: ${errorInfo.message}`
    logSaveQuoteError(errorInfo, linesError)
    await supabase.from('quote_additional_items').delete().eq('quote_id', quoteId)
    await supabase.from('quotes').delete().eq('id', quoteId)
    await supabase.from('events').delete().eq('id', eventId)
    return { data: null, error: errorInfo }
  }

  return {
    data: { id: quoteId, quote_number: data.quote_number as string | null },
    error: null,
  }
}
