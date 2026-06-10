import { buildAdditionalItemsListSelect } from '../../../Lib/additionalItemsTableSchema'
import { fetchActiveCustomers } from '../../../Lib/fetchCustomers'
import { fetchPackageOptionGroups } from '../../../Lib/fetchPackageOptionGroups'
import { buildPackagesListSelect } from '../../../Lib/packagesTableSchema'
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

  const [
    customersRes,
    packagesRes,
    additionalRes,
    packageOptionGroupsRes,
    commercialRules,
  ] = await Promise.all([
    fetchActiveCustomers(),
    supabase
      .from('packages')
      .select(buildPackagesListSelect())
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('additional_items')
      .select(buildAdditionalItemsListSelect())
      .eq('active', true)
      .order('category_pt', { ascending: true })
      .order('display_order', { ascending: true }),
    fetchPackageOptionGroups(),
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
  if (packageOptionGroupsRes.error) {
    fetchErrors.push(
      `Grupos de opções: ${packageOptionGroupsRes.error.message}`,
    )
  }

  const customers = (customersRes.data ?? []) as Customer[]
  const packages = (packagesRes.data ?? []) as unknown as Package[]
  const additionalItems = (additionalRes.data ?? []) as unknown as AdditionalItem[]

  return (
    <QuoteWizard
      customers={customers}
      packages={packages}
      additionalItems={additionalItems}
      packageOptionGroups={packageOptionGroupsRes.data ?? []}
      commercialRules={commercialRules}
      fetchErrors={fetchErrors}
    />
  )
}
