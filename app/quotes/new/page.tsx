import { fetchActiveCustomers } from '../../../Lib/fetchCustomers'
import { fetchSupabaseCommercialRules } from '../../../Lib/supabaseCommercialRules'
import QuoteWizard, {
  type AdditionalItem,
  type Customer,
  type Package,
} from './QuoteWizard'
import { supabase } from '../../../Lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewQuotePage() {
  const fetchErrors: string[] = []

  const [customersRes, packagesRes, additionalRes, commercialRules] =
    await Promise.all([
      fetchActiveCustomers(),
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

  if (customersRes.error) {
    fetchErrors.push(`Clientes: ${customersRes.error.message}`)
  }
  if (packagesRes.error) {
    fetchErrors.push(`Pacotes: ${packagesRes.error.message}`)
  }
  if (additionalRes.error) {
    fetchErrors.push(`Adicionais: ${additionalRes.error.message}`)
  }

  const customers = (customersRes.data ?? []) as Customer[]
  const packages = (packagesRes.data ?? []) as Package[]
  const additionalItems = (additionalRes.data ?? []) as AdditionalItem[]

  return (
    <QuoteWizard
      customers={customers}
      packages={packages}
      additionalItems={additionalItems}
      commercialRules={commercialRules}
      fetchErrors={fetchErrors}
    />
  )
}
