import { fetchQuoteDetail } from '@/Lib/fetchQuoteDetail'
import { fetchSupabaseCommercialRules } from '@/Lib/supabaseCommercialRules'
import { mapQuoteDetailToWizardState } from '@/Lib/mapQuoteToWizard'
import { supabase } from '@/Lib/supabase'
import QuoteWizard, {
  type AdditionalItem,
  type Customer,
  type Package,
} from '../../new/QuoteWizard'

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fetchErrors: string[] = []

  const [quoteRes, customersRes, packagesRes, additionalRes, commercialRules] =
    await Promise.all([
      fetchQuoteDetail(id),
      supabase.from('customers').select('*'),
      supabase
        .from('packages')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('additional_items')
        .select('*')
        .eq('active', true)
        .order('category_pt', { ascending: true })
        .order('display_order', { ascending: true }),
      fetchSupabaseCommercialRules(),
    ])

  if (quoteRes.error || !quoteRes.data) {
    return (
      <main className="min-h-screen bg-cdl-bg p-6 text-cdl-fg sm:p-10">
        <h1 className="text-2xl font-bold text-cdl-title">
          Erro ao carregar cotação
        </h1>
        <pre className="mt-4 rounded-2xl border border-cdl-border bg-cdl-surface p-4 text-sm text-red-400">
          {quoteRes.error?.message ?? 'Cotação não encontrada.'}
        </pre>
      </main>
    )
  }

  if (customersRes.error) {
    fetchErrors.push(`Clientes: ${customersRes.error.message}`)
  }
  if (packagesRes.error) {
    fetchErrors.push(`Pacotes: ${packagesRes.error.message}`)
  }
  if (additionalRes.error) {
    fetchErrors.push(`Adicionais: ${additionalRes.error.message}`)
  }

  const quote = quoteRes.data
  const { state, pricingFingerprint } = mapQuoteDetailToWizardState(
    quote,
    commercialRules,
  )

  return (
    <QuoteWizard
      mode="edit"
      quoteId={id}
      initialState={state}
      initialPricingFingerprint={pricingFingerprint}
      existingSnapshot={quote}
      customers={(customersRes.data ?? []) as Customer[]}
      packages={(packagesRes.data ?? []) as Package[]}
      additionalItems={(additionalRes.data ?? []) as AdditionalItem[]}
      commercialRules={commercialRules}
      fetchErrors={fetchErrors}
    />
  )
}
