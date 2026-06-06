'use client'

import { useState } from 'react'
import { getQuotePdfFilename } from '../../../Lib/quotePdfFilename'

export default function QuotePdfDownload({
  quoteId,
  quoteNumber,
}: {
  quoteId: string
  quoteNumber: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/quotes/${quoteId}/pdf`)
      if (!response.ok) {
        throw new Error('Não foi possível gerar o PDF.')
      }

      const blob = await response.blob()
      const filename = getQuotePdfFilename(quoteNumber)
      const file = new File([blob], filename, { type: 'application/pdf' })

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `${quoteNumber} — BBQ At Home`,
            text: `Proposta de cotação ${quoteNumber}`,
          })
          return
        } catch (shareError) {
          if (shareError instanceof Error && shareError.name === 'AbortError') {
            return
          }
        }
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Erro ao baixar PDF.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="cdl-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Gerando PDF…' : 'Baixar PDF'}
      </button>
      {error ? (
        <p className="text-center text-xs text-red-400 sm:text-left">{error}</p>
      ) : null}
    </div>
  )
}
