'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteQuoteButton({
  quoteId,
  className = '',
  compact = false,
  redirectToList = true,
  onDeleted,
}: {
  quoteId: string
  className?: string
  compact?: boolean
  redirectToList?: boolean
  onDeleted?: (quoteId: string) => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta cotação?',
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
        cache: 'no-store',
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(result.error ?? 'Não foi possível excluir a cotação.')
        return
      }

      onDeleted?.(quoteId)

      if (redirectToList) {
        router.push('/quotes')
        router.refresh()
      }
    } catch {
      setError('Não foi possível excluir a cotação.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={className.includes('pscs-btn-danger') ? '' : className}>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className={`inline-flex items-center justify-center rounded-lg font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          className.includes('pscs-btn-danger')
            ? `pscs-btn-danger ${compact ? 'min-w-0 flex-1 px-3 py-2 text-xs sm:flex-none' : 'px-5 py-3 text-sm'}`
            : `border border-cdl-action/50 bg-cdl-red-soft text-cdl-action hover:border-cdl-action ${
                compact
                  ? 'min-w-0 flex-1 px-3 py-2 text-xs sm:flex-none'
                  : 'px-5 py-3 text-sm'
              }`
        }`}
      >
        {deleting ? 'Excluindo…' : compact ? 'Excluir' : 'Excluir Cotação'}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-cdl-action">{error}</p>
      ) : null}
    </div>
  )
}
