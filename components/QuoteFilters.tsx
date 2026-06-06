'use client'

import { useMemo } from 'react'
import type { QuoteListItem } from '@/Lib/fetchQuoteList'
import { getQuoteStatusLabel } from './QuoteStatusBadge'

export type QuoteSortKey = 'event_date' | 'created_at' | 'quote_total'

export type QuoteFiltersState = {
  search: string
  status: string
  month: string
  year: string
  dateFrom: string
  dateTo: string
  sortBy: QuoteSortKey
}

export const EMPTY_FILTERS: QuoteFiltersState = {
  search: '',
  status: '',
  month: '',
  year: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'event_date',
}

function parseDate(value: string | null | undefined) {
  if (!value) return null
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function filterAndSortQuotes(
  quotes: QuoteListItem[],
  filters: QuoteFiltersState,
) {
  const search = filters.search.trim().toLowerCase()

  let result = quotes.filter((quote) => {
    if (search) {
      const haystack = [
        quote.quote_number,
        quote.customer_name,
        quote.package_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }

    if (filters.status) {
      const status = (quote.quote_status ?? 'draft').toLowerCase()
      if (status !== filters.status.toLowerCase()) return false
    }

    const eventDate = parseDate(quote.event_date)
    if (filters.month && eventDate) {
      if (String(eventDate.getMonth() + 1) !== filters.month) return false
    }
    if (filters.year && eventDate) {
      if (String(eventDate.getFullYear()) !== filters.year) return false
    }
    if (filters.dateFrom) {
      const from = parseDate(filters.dateFrom)
      if (from && (!eventDate || eventDate < from)) return false
    }
    if (filters.dateTo) {
      const to = parseDate(filters.dateTo)
      if (to && (!eventDate || eventDate > to)) return false
    }

    return true
  })

  result = [...result].sort((a, b) => {
    if (filters.sortBy === 'quote_total') {
      return Number(b.quote_total ?? 0) - Number(a.quote_total ?? 0)
    }
    if (filters.sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    const eventA = parseDate(a.event_date)?.getTime() ?? 0
    const eventB = parseDate(b.event_date)?.getTime() ?? 0
    if (eventA !== eventB) return eventB - eventA
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return result
}

export default function QuoteFilters({
  quotes,
  filters,
  onChange,
}: {
  quotes: QuoteListItem[]
  filters: QuoteFiltersState
  onChange: (next: QuoteFiltersState) => void
}) {
  const statusOptions = useMemo(() => {
    const values = new Set(
      quotes.map((quote) => (quote.quote_status ?? 'draft').toLowerCase()),
    )
    return Array.from(values).sort()
  }, [quotes])

  const yearOptions = useMemo(() => {
    const values = new Set<string>()
    for (const quote of quotes) {
      const date = parseDate(quote.event_date) ?? parseDate(quote.created_at)
      if (date) values.add(String(date.getFullYear()))
    }
    return Array.from(values).sort((a, b) => Number(b) - Number(a))
  }, [quotes])

  return (
    <section className="cdl-panel p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block min-w-0">
          <span className="cdl-eyebrow">Busca</span>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Cliente, cotação ou pacote"
            className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-sm text-cdl-fg"
          />
        </label>

        <label className="block min-w-0">
          <span className="cdl-eyebrow">Status</span>
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-sm text-cdl-fg"
          >
            <option value="">Todos</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getQuoteStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="cdl-eyebrow">Mês</span>
          <select
            value={filters.month}
            onChange={(e) => onChange({ ...filters, month: e.target.value })}
            className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-sm text-cdl-fg"
          >
            <option value="">Todos</option>
            {Array.from({ length: 12 }, (_, index) => {
              const month = String(index + 1)
              return (
                <option key={month} value={month}>
                  {new Date(2026, index, 1).toLocaleDateString('pt-BR', {
                    month: 'long',
                  })}
                </option>
              )
            })}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="cdl-eyebrow">Ano</span>
          <select
            value={filters.year}
            onChange={(e) => onChange({ ...filters, year: e.target.value })}
            className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-sm text-cdl-fg"
          >
            <option value="">Todos</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="cdl-eyebrow">Data inicial</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-sm text-cdl-fg"
          />
        </label>

        <label className="block min-w-0">
          <span className="cdl-eyebrow">Data final</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-sm text-cdl-fg"
          />
        </label>

        <label className="block min-w-0">
          <span className="cdl-eyebrow">Ordenar por</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as QuoteSortKey,
              })
            }
            className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-sm text-cdl-fg"
          >
            <option value="event_date">Data do evento</option>
            <option value="created_at">Data de criação</option>
            <option value="quote_total">Valor total</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="w-full rounded-xl border border-cdl-border bg-cdl-surface px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </section>
  )
}

export function useFilteredQuotes(
  quotes: QuoteListItem[],
  filters: QuoteFiltersState,
) {
  return useMemo(
    () => filterAndSortQuotes(quotes, filters),
    [quotes, filters],
  )
}
