import Link from 'next/link'
import DeleteQuoteButton from '@/components/DeleteQuoteButton'
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

function formatLocation(city: string | null, state: string | null) {
  const label = [city, state].filter(Boolean).join(', ')
  return label || '—'
}

function formatMiles(value: number | null | undefined) {
  if (value == null) return '0 mi'
  return `${Number(value)} mi`
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
    <div className="quote-card-metric rounded-xl border border-cdl-border/80 bg-cdl-inset/80 px-3 py-2.5">
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-cdl-muted">
        {label}
      </p>
      <p
        className={`quote-card-metric-value mt-1 text-sm font-bold leading-tight ${
          money ? 'quote-card-metric-value--money' : ''
        } ${highlight ? 'quote-card-metric-value--highlight text-cdl-price' : 'text-cdl-fg'}`}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}

function PackageBadge({ name }: { name: string | null }) {
  const label = name?.trim() || 'Não informado'
  return (
    <div className="mt-3">
      <span className="inline-flex max-w-full items-center rounded-full border border-[#f6d000]/45 bg-[#f6d000]/12 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#9a7200] dark:text-[#f6d000]">
        <span className="truncate">Pacote: {label}</span>
      </span>
    </div>
  )
}

export default function QuoteCard({
  quote,
  onDeleted,
}: {
  quote: QuoteListItem
  onDeleted?: (quoteId: string) => void
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cdl-border bg-cdl-surface p-4 shadow-cdl transition-all duration-200 hover:border-cdl-accent-border/60 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[0.65rem] font-bold uppercase tracking-wider text-cdl-muted">
          {quote.quote_number}
        </p>
        <QuoteStatusBadge status={quote.quote_status} />
      </div>

      <h2 className="mt-2 truncate text-lg font-black leading-tight text-cdl-title sm:text-xl">
        {quote.customer_name}
      </h2>

      <PackageBadge name={quote.package_name} />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Data" value={formatDate(quote.event_date)} />
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
          label="Convidados"
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
        <Metric label="Milhas" value={formatMiles(quote.mileage_distance)} />
        <Metric
          label="Taxa milhagem"
          value={formatMoney(quote.mileage_fee)}
          money
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <QuoteBoolBadge label="Adicional" value={quote.has_additionals} />
        <QuoteBoolBadge label="Churrasqueira" value={quote.has_grill} />
        <QuoteBoolBadge
          label="Foto"
          value={quote.grill_photo_required}
          variant="photo"
          hasGrill={quote.has_grill}
        />
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4 sm:flex sm:flex-wrap">
        <Link
          href={`/quotes/${quote.id}`}
          className="cdl-btn-primary inline-flex items-center justify-center px-3 py-2.5 text-xs sm:min-w-[4.5rem]"
        >
          Ver
        </Link>
        <Link
          href={`/quotes/${quote.id}/edit`}
          className="inline-flex items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border"
        >
          Editar
        </Link>
        <DeleteQuoteButton
          quoteId={quote.id}
          compact
          redirectToList={false}
          onDeleted={onDeleted}
        />
        <Link
          href={`/quotes/${quote.id}?pdf=1`}
          className="inline-flex items-center justify-center rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border"
        >
          PDF
        </Link>
      </div>
    </article>
  )
}
