import { buildCustomersListSelect } from '../../../Lib/customersTableSchema'
import { getCdlCompanyId } from '../../../Lib/cdlCompany'
import { supabase } from '../../../Lib/supabase'
import { fetchSupabaseCommercialRules } from '../../../Lib/supabaseCommercialRules'
import QuoteWizard, {
  type AdditionalItem,
  type Customer,
  type Package,
} from './QuoteWizard'

export default async function NewQuotePage() {
  const fetchErrors: string[] = []

  const companyId = getCdlCompanyId()

  const [customersRes, packagesRes, additionalRes, commercialRules] =
    await Promise.all([
      supabase
        .from('customers')
        .select(buildCustomersListSelect())
        .eq('company_id', companyId)
        .eq('active', true),
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

  const customers = (customersRes.data ?? []) as unknown as Customer[]
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
