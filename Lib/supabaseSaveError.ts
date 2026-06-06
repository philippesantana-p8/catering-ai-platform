import type { PostgrestError } from '@supabase/supabase-js'

export type SaveQuoteStep = 'validation' | 'event' | 'quote' | 'additionals'

export type SaveQuoteErrorInfo = {
  step: SaveQuoteStep
  message: string
  details: string | null
  hint: string | null
  code: string | null
  eventPayload?: Record<string, unknown> | null
  quotePayload?: Record<string, unknown> | null
  additionalItemsPayload?: Record<string, unknown>[] | null
}

function readErrorField(error: unknown, key: string): string | null {
  if (error == null || typeof error !== 'object') return null
  const value = (error as Record<string, unknown>)[key]
  if (value == null || value === '') return null
  return String(value)
}

export function formatPostgrestError(error: PostgrestError | Error | unknown) {
  if (!error) {
    return {
      message: 'Erro desconhecido.',
      details: null as string | null,
      hint: null as string | null,
      code: null as string | null,
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      details: null,
      hint: null,
      code: null,
    }
  }

  const message =
    readErrorField(error, 'message') ??
    (error instanceof Error ? error.message : null) ??
    'Erro desconhecido.'

  return {
    message,
    details: readErrorField(error, 'details'),
    hint: readErrorField(error, 'hint'),
    code: readErrorField(error, 'code'),
  }
}

export function buildSaveQuoteError(
  step: SaveQuoteStep,
  error: PostgrestError | Error | unknown,
  payloads?: {
    eventPayload?: Record<string, unknown> | null
    quotePayload?: Record<string, unknown> | null
    additionalItemsPayload?: Record<string, unknown>[] | null
  },
): SaveQuoteErrorInfo {
  const formatted = formatPostgrestError(error)
  return {
    step,
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
    code: errorInfo.code,
    message: errorInfo.message,
    details: errorInfo.details,
    hint: errorInfo.hint,
    step: errorInfo.step,
    quotePayload: errorInfo.quotePayload,
    additionalItemsPayload: errorInfo.additionalItemsPayload,
    eventPayload: errorInfo.eventPayload,
  })
}
