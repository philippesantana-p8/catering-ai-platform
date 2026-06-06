import type { PostgrestError } from '@supabase/supabase-js'

export type SaveQuoteStage = 'validation' | 'event' | 'quote' | 'additionals'

export type SaveQuoteErrorInfo = {
  stage: SaveQuoteStage
  message: string
  details: string | null
  hint: string | null
  code: string | null
  eventPayload?: Record<string, unknown> | null
  quotePayload?: Record<string, unknown> | null
  additionalItemsPayload?: Record<string, unknown>[] | null
}

export function formatPostgrestError(error: PostgrestError | Error | null | undefined) {
  if (!error) {
    return {
      message: 'Erro desconhecido.',
      details: null as string | null,
      hint: null as string | null,
      code: null as string | null,
    }
  }

  if ('code' in error) {
    return {
      message: error.message || 'Erro Supabase.',
      details: error.details ?? null,
      hint: error.hint ?? null,
      code: error.code ?? null,
    }
  }

  return {
    message: error.message || 'Erro desconhecido.',
    details: null,
    hint: null,
    code: null,
  }
}

export function buildSaveQuoteError(
  stage: SaveQuoteStage,
  error: PostgrestError | Error | null | undefined,
  payloads?: {
    eventPayload?: Record<string, unknown> | null
    quotePayload?: Record<string, unknown> | null
    additionalItemsPayload?: Record<string, unknown>[] | null
  },
): SaveQuoteErrorInfo {
  const formatted = formatPostgrestError(error)
  return {
    stage,
    message: formatted.message,
    details: formatted.details,
    hint: formatted.hint,
    code: formatted.code,
    eventPayload: payloads?.eventPayload ?? null,
    quotePayload: payloads?.quotePayload ?? null,
    additionalItemsPayload: payloads?.additionalItemsPayload ?? null,
  }
}

export function logSaveQuoteError(
  errorInfo: SaveQuoteErrorInfo,
  rawError?: unknown,
) {
  console.error('SAVE_QUOTE_ERROR', {
    error: rawError ?? errorInfo,
    stage: errorInfo.stage,
    code: errorInfo.code,
    message: errorInfo.message,
    details: errorInfo.details,
    hint: errorInfo.hint,
    eventPayload: errorInfo.eventPayload,
    quotePayload: errorInfo.quotePayload,
    additionalItemsPayload: errorInfo.additionalItemsPayload,
  })
}
