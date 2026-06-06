import Link from 'next/link'
import { supabase } from '../../Lib/supabase'

export default async function QuotesPage() {
  const { data, error } = await supabase
    .from('quote_list_view')
    .select('*')
    .order('created_at', { ascending: false })

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

  return (
    <main className="min-h-screen bg-cdl-bg px-6 py-10 text-cdl-fg sm:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-black text-cdl-title sm:text-5xl">
          COTAÇÕES CDL
        </h1>

        <p className="mt-2 text-cdl-text-secondary">
          Catering AI Platform · BBQ at Home
        </p>

        <Link
          href="/quotes/new"
          className="mt-6 inline-block rounded-xl bg-cdl-accent px-5 py-3 text-sm font-bold text-cdl-on-accent transition-opacity hover:opacity-90"
        >
          Nova cotação
        </Link>

        <div className="mt-10 space-y-5">
          {data?.map((quote: {
            id: string
            quote_number: string
            ab_name?: string | null
            package_name?: string | null
            quote_total?: number | null
            reservation_amount?: number | null
            balance_due?: number | null
          }) => (
            <article
              key={quote.id}
              className="cdl-panel p-6 sm:p-8"
            >
              <h2 className="text-xl font-bold text-cdl-fg">
                {quote.quote_number}
              </h2>

              <h3 className="mt-2 text-lg font-bold text-cdl-text-secondary">
                {quote.ab_name || 'Cliente não informado'}
              </h3>

              <p className="mt-1 text-cdl-muted">{quote.package_name}</p>

              <div className="mt-5 space-y-1 text-sm text-cdl-text-secondary">
                <p>
                  <strong>Total:</strong>{' '}
                  <span className="font-bold text-cdl-price">
                    ${Number(quote.quote_total || 0).toFixed(2)}
                  </span>
                </p>
                <p>
                  <strong>Reserva:</strong>{' '}
                  <span className="font-bold text-cdl-price">
                    ${Number(quote.reservation_amount || 0).toFixed(2)}
                  </span>
                </p>
                <p>
                  <strong>Saldo:</strong>{' '}
                  <span className="font-bold text-cdl-price">
                    ${Number(quote.balance_due || 0).toFixed(2)}
                  </span>
                </p>
              </div>

              <Link
                href={`/quotes/${quote.id}`}
                className="cdl-btn-primary mt-5 inline-block"
              >
                Visualizar Cotação
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
