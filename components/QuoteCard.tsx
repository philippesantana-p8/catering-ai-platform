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
    month: '2-digit',
    year: '2-digit',
  })
}

function formatMonthYear(value: string | null | undefined) {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function formatLocation(city: string | null, state: string | null) {
  const label = [city, state].filter(Boolean).join(', ')
  return label || '—'
}

function Metric({
  label,
  value,
  money,
  highlight,
}: {
  label: string
  value: string
  money?: boolean
  highlight?: boolean
}) {
  return (
    <div className="quote-card-metric rounded-lg border border-cdl-border bg-cdl-inset px-2 py-2">
      <p className="quote-card-metric-label font-bold uppercase text-cdl-muted">
        {label}
      </p>
      <p
        className={`quote-card-metric-value ${
          money ? 'quote-card-metric-value--money' : ''
        } ${highlight ? 'quote-card-metric-value--highlight' : 'text-cdl-fg'}`}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}

export default function QuoteCard({ quote }: { quote: QuoteListItem }) {
  return (
    <article className="cdl-panel flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.65rem] font-bold uppercase tracking-wider text-cdl-muted">
            {quote.quote_number}
          </p>
          <h2 className="mt-0.5 truncate text-base font-black text-cdl-title sm:text-lg">
            {quote.customer_name}
          </h2>
          <p className="mt-0.5 truncate text-xs text-cdl-text-secondary">
            {quote.package_name ?? 'Pacote não informado'}
          </p>
        </div>
        <QuoteStatusBadge status={quote.quote_status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <Metric label="Data" value={formatDate(quote.event_date)} />
        <Metric label="Mês/ano" value={formatMonthYear(quote.event_date)} />
        <Metric label="Local" value={formatLocation(quote.city, quote.state)} />
        <Metric
          label="Total"
          value={formatMoney(quote.quote_total)}
          money
          highlight
        />
        <Metric
          label="Reserva"
          value={formatMoney(quote.reservation_amount)}
          money
        />
        <Metric label="Saldo" value={formatMoney(quote.balance_due)} money />
        <Metric
          label="Conv."
          value={
            quote.physical_guest_count != null
              ? String(quote.physical_guest_count)
              : '—'
          }
        />
        <Metric
          label="Cobradas"
          value={
            quote.billable_guest_count != null
              ? String(quote.billable_guest_count)
              : '—'
          }
        />
        <Metric label="Milhas" value={formatMoney(quote.mileage_fee)} money />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <QuoteBoolBadge label="Adicional" value={quote.has_additionals} />
        <QuoteBoolBadge label="Churrasqueira" value={quote.has_grill} />
        <QuoteBoolBadge
          label="Foto"
          value={quote.grill_photo_required}
          variant="photo"
        />
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        <Link
          href={`/quotes/${quote.id}`}
          className="cdl-btn-primary inline-flex min-w-0 flex-1 items-center justify-center px-3 py-2 text-xs sm:flex-none"
        >
          Ver
        </Link>
        <Link
          href={`/quotes/${quote.id}/edit`}
          className="inline-flex min-w-0 flex-1 items-center justify-center rounded-lg border border-cdl-border bg-cdl-surface px-3 py-2 text-xs font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border sm:flex-none"
        >
          Editar
        </Link>
        <Link
          href={`/quotes/${quote.id}?pdf=1`}
          className="inline-flex min-w-0 flex-1 items-center justify-center rounded-lg border border-cdl-border bg-cdl-inset px-3 py-2 text-xs font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border sm:flex-none"
        >
          PDF
        </Link>
      </div>
    </article>
  )
}
