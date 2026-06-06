'use client'

import type { SaveQuoteErrorInfo } from '@/Lib/supabaseSaveError'

function ErrorField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-semibold text-red-300/90">{label}</dt>
      <dd className="mt-0.5 font-mono text-xs break-all text-red-200/90">
        {value?.trim() ? value : '—'}
      </dd>
    </div>
  )
}

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
        <dl className="mt-2 space-y-2 text-xs text-red-200/90">
          <ErrorField label="code" value={errorInfo.code} />
          <ErrorField label="message" value={errorInfo.message} />
          <ErrorField label="details" value={errorInfo.details} />
          <ErrorField label="hint" value={errorInfo.hint} />
          <ErrorField label="step" value={errorInfo.step} />
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
