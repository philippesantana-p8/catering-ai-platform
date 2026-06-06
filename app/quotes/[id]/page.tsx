import Link from 'next/link'
import { supabase } from '../../../Lib/supabase'

type AdditionalItem = {
  item_id: string
  item_key: string
  label_pt: string
  label_en: string
  label_es: string
  category_pt: string
  category_en: string
  category_es: string
  quantity: number
  unit_price: number
  total_price: number
}

type QuoteDetail = {
  id: string
  quote_number: string
  quote_status: string
  language: string
  customer_name: string | null
  package_name_pt: string | null
  package_name_en: string | null
  package_name_es: string | null
  billable_guests: number | null
  event_name: string | null
  event_date: string | null
  venue_name: string | null
  address_line: string | null
  city: string | null
  state: string | null
  has_grill: boolean | null
  grill_photo_required: boolean | null
  grill_rental_required: boolean | null
  grill_rental_qty: number | null
  grill_notes: string | null
  grill_masters_qty: number | null
  assistants_qty: number | null
  mileage_base_location: string | null
  mileage_distance: number | null
  mileage_free_limit: number | null
  mileage_rate: number | null
  mileage_fee: number | null
  package_total: number | null
  additional_total: number | null
  reservation_amount: number | null
  balance_due: number | null
  quote_total: number | null
  additional_items: AdditionalItem[] | null
}

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatBool(value: boolean | null | undefined) {
  if (value === null || value === undefined) return '—'
  return value ? 'Sim' : 'Não'
}

function getLabel(item: AdditionalItem, language: string) {
  if (language === 'en') return item.label_en
  if (language === 'es') return item.label_es
  return item.label_pt
}

function getCategory(item: AdditionalItem, language: string) {
  if (language === 'en') return item.category_en
  if (language === 'es') return item.category_es
  return item.category_pt
}

function getPackageName(quote: QuoteDetail) {
  if (quote.language === 'en') return quote.package_name_en
  if (quote.language === 'es') return quote.package_name_es
  return quote.package_name_pt
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-cdl-muted">
        {label}
      </span>
      <span className="text-sm text-cdl-fg">{value ?? '—'}</span>
    </div>
  )
}

function SectionCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-3xl border border-cdl-border bg-cdl-surface p-6 shadow-cdl ${className}`}
    >
      <h2 className="cdl-section-title">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function HighlightCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <article className="rounded-3xl border border-cdl-border bg-cdl-surface p-6 shadow-cdl sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-cdl-muted">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-2xl font-bold text-cdl-fg sm:text-3xl">{title}</h3>
      <div className="mt-5 space-y-3 text-sm text-cdl-text-secondary">{children}</div>
    </article>
  )
}

function HighlightRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-cdl-accent">
        {label}
      </span>
      <span className="text-cdl-fg">{value ?? '—'}</span>
    </div>
  )
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data, error } = await supabase
    .from('quote_detail_view')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return (
      <main className="min-h-screen bg-cdl-bg p-6 text-cdl-fg sm:p-10">
        <h1 className="text-2xl font-bold text-cdl-title">
          Erro ao carregar cotação
        </h1>
        <pre className="mt-4 rounded-3xl bg-cdl-surface p-4 text-sm text-red-400">
          {error.message}
        </pre>
      </main>
    )
  }

  const quote = data as QuoteDetail
  const additionalItems = quote.additional_items ?? []
  const lang = quote.language ?? 'pt'
  const packageName = getPackageName(quote)
  const venueLine = [quote.venue_name, quote.city, quote.state]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-8 text-cdl-fg sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/quotes"
          className="mb-8 inline-flex items-center text-sm text-cdl-muted transition-colors hover:text-cdl-accent"
        >
          ← Voltar às cotações
        </Link>

        {/* Hero principal */}
        <header className="relative mb-8 overflow-hidden rounded-3xl border border-cdl-border bg-cdl-surface px-6 py-10 sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 cdl-hero-glow"
            aria-hidden
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cdl-accent-border bg-cdl-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cdl-accent">
                {quote.quote_number}
              </span>
              <span className="rounded-full border border-cdl-border bg-cdl-inset px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cdl-text-secondary">
                {quote.quote_status ?? '—'}
              </span>
            </div>

            <h1 className="mt-6 text-5xl font-black tracking-tight text-cdl-title sm:text-6xl">
              BBQ AT HOME
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-cdl-text-secondary sm:text-xl">
              Experiência premium de churrasco na sua casa · Catering AI
              Platform
            </p>
          </div>
        </header>

        {/* Cliente e evento em destaque */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HighlightCard
            eyebrow="Cliente"
            title={quote.customer_name ?? 'Cliente não informado'}
          >
            <HighlightRow label="Cotação" value={quote.quote_number} />
            <HighlightRow label="Idioma" value={quote.language?.toUpperCase()} />
          </HighlightCard>

          <HighlightCard
            eyebrow="Evento"
            title={quote.event_name ?? 'Evento não informado'}
          >
            <HighlightRow label="Data" value={formatDate(quote.event_date)} />
            <HighlightRow label="Local" value={venueLine || '—'} />
            <HighlightRow label="Endereço" value={quote.address_line} />
          </HighlightCard>
        </div>

        {/* Pacote em destaque */}
        <section className="mb-8 rounded-3xl border-2 border-cdl-accent-border bg-gradient-to-br from-cdl-surface to-cdl-inset p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cdl-muted">
            Pacote selecionado
          </p>
          <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black text-cdl-fg sm:text-4xl">
                {packageName ?? '—'}
              </h2>
              <p className="mt-2 text-cdl-text-secondary">
                {quote.billable_guests != null
                  ? `${quote.billable_guests} convidados faturáveis`
                  : 'Convidados não informados'}
              </p>
            </div>
            <div className="rounded-2xl bg-cdl-accent px-6 py-4 text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-cdl-on-accent/70">
                Valor do pacote
              </p>
              <p className="text-3xl font-black text-cdl-on-accent">
                {formatCurrency(quote.package_total)}
              </p>
            </div>
          </div>
        </section>

        {/* Cards operacionais */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="BBQ Setup">
            <Field label="Has Grill" value={formatBool(quote.has_grill)} />
            <Field
              label="Grill Photo Required"
              value={formatBool(quote.grill_photo_required)}
            />
            <Field
              label="Grill Rental Required"
              value={formatBool(quote.grill_rental_required)}
            />
            <Field
              label="Grill Rental Quantity"
              value={quote.grill_rental_qty ?? 0}
            />
            <div className="sm:col-span-2">
              <Field label="Grill Notes" value={quote.grill_notes} />
            </div>
          </SectionCard>

          <SectionCard title="Team">
            <Field
              label="Grill Masters Qty"
              value={quote.grill_masters_qty ?? 0}
            />
            <Field
              label="Assistants Qty"
              value={quote.assistants_qty ?? 0}
            />
          </SectionCard>

          <SectionCard title="Mileage" className="lg:col-span-2">
            <Field
              label="Base Location"
              value={quote.mileage_base_location}
            />
            <Field
              label="Distance"
              value={
                quote.mileage_distance != null
                  ? `${quote.mileage_distance} mi`
                  : '—'
              }
            />
            <Field
              label="Free Limit"
              value={
                quote.mileage_free_limit != null
                  ? `${quote.mileage_free_limit} mi`
                  : '—'
              }
            />
            <Field
              label="Rate"
              value={
                quote.mileage_rate != null
                  ? `${formatCurrency(quote.mileage_rate)}/mi`
                  : '—'
              }
            />
            <Field
              label="Mileage Fee"
              value={formatCurrency(quote.mileage_fee)}
            />
          </SectionCard>
        </div>

        {/* Selected Additionals */}
        <section className="cdl-panel mt-8 p-6 sm:p-8">
          <h2 className="cdl-section-title">Selected Additionals</h2>

          {additionalItems.length === 0 ? (
            <p className="text-sm text-cdl-muted">Nenhum adicional selecionado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {additionalItems.map((item) => (
                <article
                  key={item.item_id}
                  className="rounded-2xl border border-cdl-border bg-cdl-inset p-5 transition-colors hover:border-cdl-accent-border"
                >
                  <h3 className="font-bold text-cdl-fg">
                    {getLabel(item, lang)}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cdl-accent">
                    {getCategory(item, lang)}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-cdl-muted">Quantidade</p>
                      <p className="text-lg font-semibold">{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-cdl-muted">Preço</p>
                      <p className="text-lg font-bold text-cdl-price">
                        {formatCurrency(item.total_price)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Financial Summary — total no final */}
        <section className="mt-8 rounded-3xl border-2 border-cdl-accent-border bg-cdl-surface p-6 sm:p-8">
          <h2 className="cdl-section-title">Financial Summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Package Total"
              value={formatCurrency(quote.package_total)}
            />
            <Field
              label="Additional Total"
              value={formatCurrency(quote.additional_total)}
            />
            <Field
              label="Mileage Fee"
              value={formatCurrency(quote.mileage_fee)}
            />
            <Field
              label="Reservation Amount"
              value={formatCurrency(quote.reservation_amount)}
            />
            <Field
              label="Balance Due"
              value={formatCurrency(quote.balance_due)}
            />
          </div>
          <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-cdl-accent px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-cdl-on-accent">
              Quote Total
            </span>
            <span className="text-3xl font-black text-cdl-on-accent sm:text-4xl">
              {formatCurrency(quote.quote_total)}
            </span>
          </div>
        </section>
      </div>
    </main>
  )
}
