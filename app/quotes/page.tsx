import Link from 'next/link'
import CdlBrandLogo from '../../components/CdlBrandLogo'
import { fetchQuoteList } from '../../Lib/fetchQuoteList'
import { formatDate } from './[id]/quoteDetailTypes'

function formatCreatedAt(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`
}

export default async function QuotesPage() {
  const { data, error } = await fetchQuoteList()

  if (error) {
    return (
      <main className="min-h-screen bg-cdl-bg p-10 text-cdl-fg">
        <h1 className="text-2xl font-bold text-red-400">Erro</h1>
        <pre className="mt-4 rounded-3xl bg-cdl-surface p-4 text-sm text-red-400">
          {error.message}
        </pre>
      </main>
    )
  }

  const quotes = data ?? []

  return (
    <main className="min-h-screen bg-cdl-bg px-6 py-10 text-cdl-fg sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-5">
          <CdlBrandLogo size="sm" className="!h-20 !w-20" />
          <div>
            <h1 className="text-4xl font-black text-cdl-title sm:text-5xl">
              COTAÇÕES CDL
            </h1>
            <p className="mt-2 text-cdl-text-secondary">
              Catering AI Platform · BBQ at Home
            </p>
          </div>
        </div>

        <Link
          href="/quotes/new"
          className="mt-6 inline-block rounded-xl bg-cdl-accent px-5 py-3 text-sm font-bold text-cdl-on-accent transition-opacity hover:opacity-90"
        >
          Nova cotação
        </Link>

        {quotes.length === 0 ? (
          <p className="mt-10 text-cdl-text-secondary">
            Nenhuma cotação ativa encontrada.
          </p>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-cdl-border text-xs uppercase tracking-wide text-cdl-muted">
                  <th className="px-3 py-3 font-semibold">Cotação</th>
                  <th className="px-3 py-3 font-semibold">Cliente</th>
                  <th className="px-3 py-3 font-semibold">Data do evento</th>
                  <th className="px-3 py-3 font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Criada em</th>
                  <th className="px-3 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="border-b border-cdl-border/70 hover:bg-cdl-surface/40"
                  >
                    <td className="px-3 py-4 font-bold text-cdl-fg">
                      {quote.quote_number}
                    </td>
                    <td className="px-3 py-4 text-cdl-text-secondary">
                      {quote.customer_name}
                    </td>
                    <td className="px-3 py-4 text-cdl-text-secondary">
                      {formatDate(quote.event_date)}
                    </td>
                    <td className="px-3 py-4 font-bold text-cdl-price">
                      {formatMoney(quote.quote_total)}
                    </td>
                    <td className="px-3 py-4 capitalize text-cdl-text-secondary">
                      {quote.quote_status ?? '—'}
                    </td>
                    <td className="px-3 py-4 text-cdl-text-secondary">
                      {formatCreatedAt(quote.created_at)}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="cdl-btn-primary inline-block whitespace-nowrap"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
