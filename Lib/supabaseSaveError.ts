import type { PostgrestError } from '@supabase/supabase-js'

export type SaveQuoteStep = 'validation' | 'event' | 'quote' | 'additionals'

export type SaveQuoteErrorInfo = {
  step: SaveQuoteStep
  message: string
  details: string | null
  hint: string | null
  code: string | null
  rawError?: string | null
  eventPayload?: Record<string, unknown> | null
  quotePayload?: Record<string, unknown> | null
  additionalItemsPayload?: Record<string, unknown>[] | null
}

function serializeUnknownError(error: unknown): string {
  if (error == null) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    return JSON.stringify(
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...Object.fromEntries(
          Object.entries(error as unknown as Record<string, unknown>).filter(
            ([key]) => !['name', 'message', 'stack'].includes(key),
          ),
        ),
      },
      null,
      2,
    )
  }
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
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
      rawError: '',
    }
  }

  const rawError = serializeUnknownError(error)

  if (typeof error === 'string') {
    return {
      message: error,
      details: null,
      hint: null,
      code: null,
      rawError,
    }
  }

  const message =
    readErrorField(error, 'message') ??
    (error instanceof Error ? error.message : null) ??
    (rawError ? rawError.slice(0, 500) : null) ??
    'Erro desconhecido.'

  return {
    message,
    details: readErrorField(error, 'details'),
    hint: readErrorField(error, 'hint'),
    code: readErrorField(error, 'code'),
    rawError,
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
    rawError: formatted.rawError || null,
    eventPayload: payloads?.eventPayload ?? null,
    quotePayload: payloads?.quotePayload ?? null,
    additionalItemsPayload: payloads?.additionalItemsPayload ?? null,
  }
}

/** Garante SaveQuoteErrorInfo completo a partir de qualquer retorno de erro. */
export function normalizeSaveQuoteError(
  value: unknown,
  fallbackStep: SaveQuoteStep = 'quote',
): SaveQuoteErrorInfo {
  if (value && typeof value === 'object' && 'step' in value && 'message' in value) {
    const info = value as SaveQuoteErrorInfo
    return {
      step: info.step ?? fallbackStep,
      message: info.message?.trim() || 'Erro desconhecido.',
      details: info.details ?? null,
      hint: info.hint ?? null,
      code: info.code ?? null,
      rawError: info.rawError ?? serializeUnknownError(value),
      eventPayload: info.eventPayload ?? null,
      quotePayload: info.quotePayload ?? null,
      additionalItemsPayload: info.additionalItemsPayload ?? null,
    }
  }

  return buildSaveQuoteError(fallbackStep, value)
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
    rawError: errorInfo.rawError,
  })
}
