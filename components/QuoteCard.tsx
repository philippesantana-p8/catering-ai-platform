import Link from 'next/link'
import type { QuoteListItem } from '@/Lib/fetchQuoteList'
import { QuoteBoolBadge } from './QuoteStatusBadge'
import QuoteStatusBadge from './QuoteStatusBadge'

function formatMoney(value: number | null | undefined) {
  if (value == null) return '—'
  return `$${Number(value).toFixed(2)}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatMonthYear(value: string | null | undefined) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function formatLocation(city: string | null, state: string | null) {
  const label = [city, state].filter(Boolean).join(', ')
  return label || '—'
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="min-w-0 rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5">
      <p className="cdl-eyebrow leading-snug">{label}</p>
      <p
        className={`cdl-metric-value cdl-metric-value--money mt-1 ${
          highlight ? 'text-cdl-price' : 'text-cdl-fg'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default function QuoteCard({ quote }: { quote: QuoteListItem }) {
  return (
    <article className="cdl-panel flex h-full flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-cdl-muted">
            {quote.quote_number}
          </p>
          <h2 className="mt-1 truncate text-xl font-black text-cdl-title">
            {quote.customer_name}
          </h2>
          <p className="mt-1 text-sm text-cdl-text-secondary">
            {quote.package_name ?? 'Pacote não informado'}
          </p>
        </div>
        <QuoteStatusBadge status={quote.quote_status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Data evento" value={formatDate(quote.event_date)} />
        <Metric label="Mês/ano" value={formatMonthYear(quote.event_date)} />
        <Metric label="Local" value={formatLocation(quote.city, quote.state)} />
        <Metric
          label="Total"
          value={formatMoney(quote.quote_total)}
          highlight
        />
        <Metric label="Reserva" value={formatMoney(quote.reservation_amount)} />
        <Metric label="Saldo" value={formatMoney(quote.balance_due)} />
        <Metric
          label="Conv. físicos"
          value={
            quote.physical_guest_count != null
              ? String(quote.physical_guest_count)
              : '—'
          }
        />
        <Metric
          label="Pessoas cobradas"
          value={
            quote.billable_guest_count != null
              ? String(quote.billable_guest_count)
              : '—'
          }
        />
        <Metric label="Milhagem" value={formatMoney(quote.mileage_fee)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <QuoteBoolBadge label="Adicional" value={quote.has_additionals} />
        <QuoteBoolBadge label="Churrasqueira" value={quote.has_grill} />
        <QuoteBoolBadge
          label="Foto"
          value={quote.grill_photo_required}
          variant="photo"
        />
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row sm:flex-wrap">
        <Link
          href={`/quotes/${quote.id}`}
          className="cdl-btn-primary inline-flex flex-1 items-center justify-center sm:min-w-[7rem] sm:flex-none"
        >
          Ver
        </Link>
        <Link
          href={`/quotes/${quote.id}/edit`}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border sm:min-w-[7rem] sm:flex-none"
        >
          Editar
        </Link>
        <Link
          href={`/quotes/${quote.id}?pdf=1`}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-cdl-border bg-cdl-inset px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border sm:min-w-[7rem] sm:flex-none"
        >
          PDF
        </Link>
      </div>
    </article>
  )
}
