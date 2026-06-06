'use client'

import { useEffect, useState } from 'react'
import {
  EMPTY_FILTERS,
  type QuoteFiltersState,
  type QuoteSortKey,
} from './QuoteFilters'

function CalendarIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function hasActiveDateFilters(filters: QuoteFiltersState) {
  return Boolean(
    filters.month ||
      filters.year ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.sortBy !== EMPTY_FILTERS.sortBy,
  )
}

export function QuoteDateFiltersTrigger({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
        active
          ? 'border-cdl-accent-border bg-cdl-accent/10 text-cdl-brand'
          : 'border-cdl-border bg-cdl-inset text-cdl-fg hover:border-cdl-accent-border'
      }`}
      aria-label="Filtrar por datas"
    >
      <CalendarIcon />
      <span className="uppercase tracking-wider">Datas</span>
      {active ? (
        <span className="rounded-full bg-cdl-accent px-1.5 py-0.5 text-[0.6rem] text-cdl-on-accent">
          •
        </span>
      ) : null}
    </button>
  )
}

export default function QuoteDateFiltersSheet({
  open,
  filters,
  yearOptions,
  onClose,
  onApply,
}: {
  open: boolean
  filters: QuoteFiltersState
  yearOptions: string[]
  onClose: () => void
  onApply: (next: QuoteFiltersState) => void
}) {
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Fechar filtros de data"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-date-filters-title"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-cdl-border bg-cdl-surface p-5 pb-8 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="quote-date-filters-title"
            className="text-lg font-black text-cdl-title"
          >
            Filtrar por datas
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-cdl-muted"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="block min-w-0">
            <span className="cdl-eyebrow">Mês</span>
            <select
              value={draft.month}
              onChange={(e) => setDraft({ ...draft, month: e.target.value })}
              className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-3 text-sm text-cdl-fg"
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
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
              className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-3 text-sm text-cdl-fg"
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
              value={draft.dateFrom}
              onChange={(e) =>
                setDraft({ ...draft, dateFrom: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-3 text-sm text-cdl-fg"
            />
          </label>

          <label className="block min-w-0">
            <span className="cdl-eyebrow">Data final</span>
            <input
              type="date"
              value={draft.dateTo}
              onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })}
              className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-3 text-sm text-cdl-fg"
            />
          </label>

          <label className="block min-w-0">
            <span className="cdl-eyebrow">Ordenar por</span>
            <select
              value={draft.sortBy}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  sortBy: e.target.value as QuoteSortKey,
                })
              }
              className="mt-1 w-full rounded-xl border border-cdl-border bg-cdl-inset px-3 py-3 text-sm text-cdl-fg"
            >
              <option value="event_date">Data do evento</option>
              <option value="created_at">Data de criação</option>
              <option value="quote_total">Valor total</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              const cleared = {
                ...draft,
                month: '',
                year: '',
                dateFrom: '',
                dateTo: '',
                sortBy: EMPTY_FILTERS.sortBy,
              }
              setDraft(cleared)
              onApply(cleared)
              onClose()
            }}
            className="min-h-[44px] rounded-xl border border-cdl-border bg-cdl-surface px-4 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft)
              onClose()
            }}
            className="min-h-[44px] rounded-xl bg-cdl-accent px-4 py-3 text-sm font-bold uppercase tracking-wider text-cdl-on-accent"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
