'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { QuoteListItem } from '@/Lib/fetchQuoteList'
import CdlBrandLogo from './CdlBrandLogo'
import QuoteCard from './QuoteCard'
import QuoteFilters, {
  EMPTY_FILTERS,
  useFilteredQuotes,
  type QuoteFiltersState,
} from './QuoteFilters'

export default function QuotesDashboard({
  quotes,
}: {
  quotes: QuoteListItem[]
}) {
  const [filters, setFilters] = useState<QuoteFiltersState>(EMPTY_FILTERS)
  const filteredQuotes = useFilteredQuotes(quotes, filters)

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
                {summary.count} cotação(ões) · ${summary.totalValue.toFixed(2)} em propostas
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

        <QuoteFilters
          quotes={quotes}
          filters={filters}
          onChange={setFilters}
        />

        {filteredQuotes.length === 0 ? (
          <div className="cdl-panel p-8 text-center text-cdl-text-secondary">
            Nenhuma cotação ativa encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
