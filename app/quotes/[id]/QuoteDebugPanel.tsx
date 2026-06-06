import { OFFICIAL_GUEST_FIELD_NAMES } from '@/Lib/quoteGuestFields'
import { QUOTE_SNAPSHOT_FINANCIAL_FIELDS } from '@/Lib/readQuoteSnapshot'

type QuoteDebugData = {
  quote_id?: string | null
  package_id?: string | null
  package_key?: string | null
  customer_id?: string | null
  adult_count?: number | null
  children_under_3_count?: number | null
  children_4_to_12_count?: number | null
  physical_guest_count?: number | null
  billable_guest_count?: number | null
  package_unit_price?: number | null
  package_total?: number | null
  additional_total?: number | null
  mileage_base_location?: string | null
  mileage_fee?: number | null
  reservation_amount?: number | null
  reservation_percentage?: number | null
  quote_total?: number | null
  balance_due?: number | null
  missingFields?: string[]
}

function DebugRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-cdl-border bg-cdl-inset px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-cdl-muted">
        {label}
      </span>
      <code className="break-all text-xs text-cdl-fg">
        {value === null || value === undefined || value === ''
          ? '—'
          : String(value)}
      </code>
    </div>
  )
}

export default function QuoteDebugPanel({ quote }: { quote: QuoteDebugData }) {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <section className="no-print mt-8 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-6">
      <h2 className="text-lg font-bold text-amber-300">Debug Supabase Snapshot</h2>
      <p className="mt-2 text-sm text-amber-100/80">
        Valores exibidos na tela vêm do snapshot salvo. Campos financeiros:{' '}
        {QUOTE_SNAPSHOT_FINANCIAL_FIELDS.join(', ')}.
      </p>
      {quote.missingFields && quote.missingFields.length > 0 ? (
        <p className="mt-2 text-sm text-amber-200">
          Snapshot incompleto: {quote.missingFields.join(', ')}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <DebugRow label="quote_id" value={quote.quote_id} />
        <DebugRow label="package_id" value={quote.package_id} />
        <DebugRow label="package_key" value={quote.package_key} />
        <DebugRow label="customer_id" value={quote.customer_id} />
        <DebugRow label="adult_count" value={quote.adult_count} />
        <DebugRow
          label="children_under_3_count"
          value={quote.children_under_3_count}
        />
        <DebugRow
          label="children_4_to_12_count"
          value={quote.children_4_to_12_count}
        />
        <DebugRow
          label="physical_guest_count"
          value={quote.physical_guest_count}
        />
        <DebugRow
          label="billable_guest_count"
          value={quote.billable_guest_count}
        />
        <DebugRow label="package_unit_price" value={quote.package_unit_price} />
        <DebugRow label="package_total" value={quote.package_total} />
        <DebugRow label="additional_total" value={quote.additional_total} />
        <DebugRow
          label="mileage_base_location"
          value={quote.mileage_base_location}
        />
        <DebugRow label="mileage_fee" value={quote.mileage_fee} />
        <DebugRow
          label="reservation_percentage"
          value={quote.reservation_percentage}
        />
        <DebugRow label="reservation_amount" value={quote.reservation_amount} />
        <DebugRow label="balance_due" value={quote.balance_due} />
        <DebugRow label="quote_total" value={quote.quote_total} />
      </div>

      <p className="mt-4 text-xs text-amber-100/70">
        Campos oficiais de convidados: {OFFICIAL_GUEST_FIELD_NAMES.join(', ')}.
      </p>
    </section>
  )
}
