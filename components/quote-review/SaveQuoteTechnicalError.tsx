'use client'

import type { SaveQuoteErrorInfo } from '@/Lib/supabaseSaveError'

export default function SaveQuoteTechnicalError({
  errorInfo,
  isEditMode = false,
}: {
  errorInfo: SaveQuoteErrorInfo
  isEditMode?: boolean
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3"
    >
      <p className="text-sm font-semibold text-red-300">
        {isEditMode
          ? 'Não foi possível salvar a cotação.'
          : 'Não foi possível criar a cotação.'}
      </p>
      <div className="mt-3 rounded-lg border border-red-500/20 bg-black/20 px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-red-300/90">
          Erro técnico
        </p>
        <dl className="mt-2 space-y-1 text-xs text-red-200/90">
          <div>
            <dt className="inline font-semibold">Etapa: </dt>
            <dd className="inline font-mono">{errorInfo.stage}</dd>
          </div>
          {errorInfo.code ? (
            <div>
              <dt className="inline font-semibold">code: </dt>
              <dd className="inline font-mono">{errorInfo.code}</dd>
            </div>
          ) : null}
          <div>
            <dt className="inline font-semibold">message: </dt>
            <dd className="inline font-mono break-all">{errorInfo.message}</dd>
          </div>
          {errorInfo.details ? (
            <div>
              <dt className="inline font-semibold">details: </dt>
              <dd className="inline font-mono break-all">{errorInfo.details}</dd>
            </div>
          ) : null}
          {errorInfo.hint ? (
            <div>
              <dt className="inline font-semibold">hint: </dt>
              <dd className="inline font-mono break-all">{errorInfo.hint}</dd>
            </div>
          ) : null}
        </dl>
        {errorInfo.quotePayload ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-red-300/80">
              Payload quotes
            </summary>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-red-200/80">
              {JSON.stringify(errorInfo.quotePayload, null, 2)}
            </pre>
          </details>
        ) : null}
        {errorInfo.additionalItemsPayload?.length ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-red-300/80">
              Payload quote_additional_items
            </summary>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-red-200/80">
              {JSON.stringify(errorInfo.additionalItemsPayload, null, 2)}
            </pre>
          </details>
        ) : null}
        {errorInfo.eventPayload ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-red-300/80">
              Payload events
            </summary>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-red-200/80">
              {JSON.stringify(errorInfo.eventPayload, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  )
}
