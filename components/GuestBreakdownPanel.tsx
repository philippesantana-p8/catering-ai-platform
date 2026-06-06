import type { GuestCounts } from '@/Lib/calculateQuoteTotals'

function StatCard({
  label,
  value,
  highlight,
  money,
}: {
  label: string
  value: React.ReactNode
  highlight?: boolean
  money?: boolean
}) {
  return (
    <div
      className={`cdl-metric-card rounded-xl border px-3 py-4 shadow-cdl sm:px-4 sm:py-5 ${
        highlight
          ? 'border-cdl-accent-border bg-cdl-accent/10'
          : 'border-cdl-border bg-cdl-inset'
      }`}
    >
      <p className="cdl-eyebrow leading-snug">{label}</p>
      <p
        className={`cdl-metric-value ${
          money ? 'cdl-metric-value--money' : ''
        } ${highlight ? 'cdl-metric-value--emphasis text-cdl-price' : 'text-cdl-price'}`}
      >
        {value}
      </p>
    </div>
  )
}

type SnapshotTotals = {
  billableGuestCount: number | null
  physicalGuestCount: number | null
  quoteTotal: number | null
}

function formatCount(value: number | null) {
  return value == null ? '—' : value
}

function formatQuoteTotal(value: number | null) {
  return value == null ? '—' : `$${value.toFixed(2)}`
}

export default function GuestBreakdownPanel({
  guestCounts,
  totals,
  variant = 'default',
}: {
  guestCounts: GuestCounts
  totals: SnapshotTotals
  variant?: 'default' | 'compact' | 'pdf'
}) {
  const gridClass =
    variant === 'compact'
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'
      : 'grid grid-cols-2 gap-3 sm:grid-cols-3'

  const cards = (
    <>
      <StatCard label="Adultos" value={guestCounts.adultCount} />
      <StatCard
        label="Crianças até 3 anos"
        value={guestCounts.childrenUnder3Count}
      />
      <StatCard
        label="Crianças 4 a 12 anos"
        value={guestCounts.children4To12Count}
      />
      <StatCard
        label="Convidados físicos"
        value={formatCount(totals.physicalGuestCount)}
      />
      <StatCard
        label="Pessoas cobradas equivalentes"
        value={formatCount(totals.billableGuestCount)}
        highlight
      />
      <StatCard
        label="Total financeiro"
        value={formatQuoteTotal(totals.quoteTotal)}
        highlight
        money
      />
    </>
  )

  if (variant === 'compact') {
    return <div className={gridClass}>{cards}</div>
  }

  return (
    <div className="space-y-4">
      <div className={gridClass}>{cards}</div>

      <p className="text-sm leading-relaxed text-cdl-text-secondary">
        <strong className="font-semibold text-cdl-fg">Regra CDL:</strong>{' '}
        crianças até{' '}
        <strong className="font-semibold text-cdl-fg">3 anos</strong> não pagam;
        de <strong className="font-semibold text-cdl-fg">4 a 12 anos</strong>{' '}
        pagam meia; adultos pagam valor cheio.{' '}
        <strong className="font-semibold text-cdl-fg">
          Pessoas cobradas equivalentes
        </strong>{' '}
        = adultos + (crianças 4–12 × 0,5).
      </p>
    </div>
  )
}
