import { supabase } from '../../../Lib/supabase'
import QuoteDetailView from './QuoteDetailView'
import type { QuoteDetail } from './quoteDetailTypes'

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
        <pre className="mt-4 rounded-2xl border border-cdl-border bg-cdl-surface p-4 text-sm text-red-400">
          {error.message}
        </pre>
      </main>
    )
  }

  return <QuoteDetailView quote={data as QuoteDetail} />
}
