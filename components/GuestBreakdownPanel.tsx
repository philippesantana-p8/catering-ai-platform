import type { GuestCounts, QuoteTotals } from '@/Lib/calculateQuoteTotals'

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 text-center shadow-cdl sm:px-5 sm:py-5 ${
        highlight
          ? 'border-cdl-accent-border bg-cdl-accent/10'
          : 'border-cdl-border bg-cdl-inset'
      }`}
    >
      <p className="cdl-eyebrow">{label}</p>
      <p
        className={`mt-2 text-2xl font-black sm:text-3xl ${
          highlight ? 'text-cdl-title' : 'text-cdl-price'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default function GuestBreakdownPanel({
  guestCounts,
  totals,
  variant = 'default',
}: {
  guestCounts: GuestCounts
  totals: Pick<
    QuoteTotals,
    'billableGuestCount' | 'physicalGuestCount' | 'quoteTotal'
  >
  variant?: 'default' | 'compact' | 'pdf'
}) {
  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
          value={totals.physicalGuestCount}
        />
        <StatCard
          label="Pessoas cobradas equivalentes"
          value={totals.billableGuestCount}
          highlight
        />
        <StatCard
          label="Total financeiro"
          value={`$${totals.quoteTotal.toFixed(2)}`}
          highlight
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          value={totals.physicalGuestCount}
        />
        <StatCard
          label="Pessoas cobradas equivalentes"
          value={totals.billableGuestCount}
          highlight
        />
        <StatCard
          label="Total financeiro"
          value={`$${totals.quoteTotal.toFixed(2)}`}
          highlight
        />
      </div>

      <p className="text-sm text-cdl-text-secondary">
        Regra CDL: crianças até 3 anos não pagam; de 4 a 12 anos pagam meia;
        adultos pagam valor cheio. Pessoas cobradas equivalentes = adultos + (crianças
        4–12 × 0,5).
      </p>
    </div>
  )
}
