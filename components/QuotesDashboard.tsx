'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { QuoteListItem } from '@/Lib/fetchQuoteList'
import CdlBrandLogo from './CdlBrandLogo'
import QuoteCard from './QuoteCard'
import QuoteFilters, {
  EMPTY_FILTERS,
  useFilteredQuotes,
  type QuoteFiltersState,
} from './QuoteFilters'

function formatRefreshTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchQuotesFromApi(): Promise<QuoteListItem[]> {
  const response = await fetch('/api/quotes', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
  const result = (await response.json()) as {
    data?: QuoteListItem[]
    error?: string
  }

  if (!response.ok) {
    throw new Error(result.error ?? 'Não foi possível buscar cotações.')
  }

  return result.data ?? []
}

export default function QuotesDashboard({
  initialQuotes,
}: {
  initialQuotes: QuoteListItem[]
}) {
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteListItem[]>(initialQuotes)
  const [filters, setFilters] = useState<QuoteFiltersState>(EMPTY_FILTERS)
  const [loading, setLoading] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date())

  const filteredQuotes = useFilteredQuotes(quotes, filters)

  const refreshQuotes = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
    }
    setRefreshError(null)

    try {
      const next = await fetchQuotesFromApi()
      setQuotes(next)
      setLastUpdated(new Date())
      router.refresh()
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? error.message
          : 'Não foi possível buscar cotações.',
      )
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [router])

  useEffect(() => {
    void refreshQuotes()
  }, [refreshQuotes])

  const handleQuoteDeleted = useCallback(
    (quoteId: string) => {
      setQuotes((current) => current.filter((quote) => quote.id !== quoteId))
      void refreshQuotes({ silent: true })
    },
    [refreshQuotes],
  )

  const summary = useMemo(() => {
    const totalValue = filteredQuotes.reduce(
      (sum, quote) => sum + Number(quote.quote_total ?? 0),
      0,
    )
    return {
      count: filteredQuotes.length,
      totalValue,
    }
  }, [filteredQuotes])

  return (
    <main className="min-h-screen overflow-x-hidden bg-cdl-bg px-4 py-8 text-cdl-fg sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <CdlBrandLogo size="sm" className="!h-16 !w-16 sm:!h-20 sm:!w-20" />
            <div className="min-w-0">
              <h1 className="text-3xl font-black text-cdl-title sm:text-4xl">
                Cotações CDL
              </h1>
              <p className="mt-1 text-sm text-cdl-text-secondary">
                {summary.count} cotação(ões) · ${summary.totalValue.toFixed(2)}{' '}
                em propostas
              </p>
            </div>
          </div>
          <Link
            href="/quotes/new"
            className="inline-flex items-center justify-center rounded-xl bg-cdl-accent px-5 py-3 text-sm font-bold text-cdl-on-accent transition-opacity hover:opacity-90"
          >
            Nova cotação
          </Link>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <QuoteFilters
              quotes={quotes}
              filters={filters}
              onChange={setFilters}
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2 xl:w-56">
            <button
              type="button"
              onClick={() => void refreshQuotes()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-cdl-accent-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg shadow-cdl transition-colors hover:border-cdl-brand hover:bg-cdl-muted-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Buscando cotações…' : 'Buscar novas cotações'}
            </button>
            {lastUpdated ? (
              <p className="text-center text-xs text-cdl-muted xl:text-right">
                Atualizado agora às {formatRefreshTime(lastUpdated)}
              </p>
            ) : null}
            {refreshError ? (
              <p className="text-center text-xs text-cdl-action xl:text-right">
                {refreshError}
              </p>
            ) : null}
          </div>
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="cdl-panel p-8 text-center text-cdl-text-secondary">
            {loading
              ? 'Buscando cotações…'
              : 'Nenhuma cotação ativa encontrada com os filtros atuais.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onDeleted={handleQuoteDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
