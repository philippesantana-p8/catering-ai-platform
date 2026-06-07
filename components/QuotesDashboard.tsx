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
import { useIsMobile } from './useIsMobile'

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

function buildQuotesSummary(items: QuoteListItem[]) {
  const totalValue = items.reduce(
    (sum, quote) => sum + Number(quote.quote_total ?? 0),
    0,
  )
  return {
    count: items.length,
    totalValue,
  }
}

export default function QuotesDashboard({
  initialQuotes,
}: {
  initialQuotes: QuoteListItem[]
}) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [quotes, setQuotes] = useState<QuoteListItem[]>(initialQuotes)
  const [filters, setFilters] = useState<QuoteFiltersState>(EMPTY_FILTERS)
  const [loading, setLoading] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date())
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null)

  const filteredQuotes = useFilteredQuotes(quotes, filters)

  const refreshQuotes = useCallback(
    async (options?: { silent?: boolean; excludeIds?: string[] }) => {
      if (!options?.silent) {
        setLoading(true)
      }
      setRefreshError(null)

      try {
        const next = await fetchQuotesFromApi()
        const exclude = new Set(options?.excludeIds ?? [])
        const sanitized =
          exclude.size > 0
            ? next.filter((quote) => !exclude.has(quote.id))
            : next
        setQuotes(sanitized)
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
    },
    [router],
  )

  useEffect(() => {
    void refreshQuotes()
  }, [refreshQuotes])

  useEffect(() => {
    if (!isMobile) {
      setExpandedQuoteId(null)
    }
  }, [isMobile])

  const handleQuoteDeleted = useCallback(
    (quoteId: string) => {
      setQuotes((current) => current.filter((quote) => quote.id !== quoteId))
      setExpandedQuoteId((current) => (current === quoteId ? null : current))
      void refreshQuotes({ silent: true, excludeIds: [quoteId] })
    },
    [refreshQuotes],
  )

  const handleToggleExpand = useCallback((quoteId: string) => {
    setExpandedQuoteId((current) => (current === quoteId ? null : quoteId))
  }, [])

  const summary = useMemo(
    () => buildQuotesSummary(filteredQuotes),
    [filteredQuotes],
  )

  return (
    <main className="quotes-pscs min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex items-center gap-4">
            <CdlBrandLogo size="sm" className="!h-12 !w-12 opacity-90 sm:!h-14 sm:!w-14" />
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-[var(--brand-primary)] sm:text-4xl">
                Cotações
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-2)]/80">
                Catering AI · CDL BBQ At Home
              </p>
              <p
                className="mt-1 text-sm text-[var(--brand-text-muted)]"
                key={`${summary.count}-${summary.totalValue.toFixed(2)}`}
              >
                {summary.count} cotação(ões) · ${summary.totalValue.toFixed(2)}{' '}
                em propostas
              </p>
            </div>
          </div>
          <Link
            href="/quotes/new"
            className="pscs-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
          >
            Nova cotação
          </Link>
        </div>

        <div className="sticky top-0 z-20 -mx-4 space-y-2 bg-[color-mix(in_srgb,var(--brand-bg)_95%,transparent)] px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
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
                className="pscs-btn-outline inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Buscando cotações…' : 'Buscar novas cotações'}
              </button>
              {lastUpdated ? (
                <p className="text-center text-xs text-[var(--brand-text-muted)] xl:text-right">
                  Atualizado agora às {formatRefreshTime(lastUpdated)}
                </p>
              ) : null}
              {refreshError ? (
                <p className="text-center text-xs text-[var(--brand-danger)] xl:text-right">
                  {refreshError}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="pscs-panel p-8 text-center text-[var(--brand-text-muted)]">
            {loading
              ? 'Buscando cotações…'
              : 'Nenhuma cotação ativa encontrada com os filtros atuais.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onDeleted={handleQuoteDeleted}
                mobileCompact={isMobile}
                expanded={expandedQuoteId === quote.id}
                onToggleExpand={() => handleToggleExpand(quote.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
