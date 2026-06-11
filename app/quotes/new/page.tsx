import { buildAdditionalItemsListSelect } from '../../../Lib/additionalItemsTableSchema'
import { getCdlCompanyId } from '../../../Lib/cdlCompany'
import { fetchActiveCustomers } from '../../../Lib/fetchCustomers'
import { loadPackageConfiguration } from '../../../Lib/packageConfiguration'
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

  const companyId = getCdlCompanyId()

  let packagesQuery = supabase
    .from('packages')
    .select(buildPackagesListSelect())
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (companyId?.trim()) {
    packagesQuery = packagesQuery.eq('company_id', companyId)
  }

  let additionalQuery = supabase
    .from('additional_items')
    .select(buildAdditionalItemsListSelect())
    .eq('active', true)
    .order('category_pt', { ascending: true })
    .order('display_order', { ascending: true })

  if (companyId?.trim()) {
    additionalQuery = additionalQuery.eq('company_id', companyId)
  }

  const [customersRes, packagesRes, additionalRes, commercialRules] =
    await Promise.all([
      fetchActiveCustomers(),
      packagesQuery,
      additionalQuery,
      fetchSupabaseCommercialRules(),
    ])

  const packages = (packagesRes.data ?? []) as unknown as Package[]
  const packageConfigurationRes = await loadPackageConfiguration({
    packageIds: packages.map((pkg) => pkg.id),
  })

  if (customersRes.error) {
    fetchErrors.push(`Clientes: ${customersRes.error.message}`)
  }
  if (packagesRes.error) {
    fetchErrors.push(`Pacotes: ${packagesRes.error.message}`)
  }
  if (additionalRes.error) {
    fetchErrors.push(`Adicionais: ${additionalRes.error.message}`)
  }
  if (packageConfigurationRes.error) {
    fetchErrors.push(
      `Configuração do pacote: ${packageConfigurationRes.error.message}`,
    )
  }
  const optionQueryDebug = packageConfigurationRes.optionQueryDebug
  if (optionQueryDebug?.groupsError?.message) {
    fetchErrors.push(
      `package_option_groups: ${optionQueryDebug.groupsError.message}`,
    )
  }
  if (optionQueryDebug?.itemsError?.message) {
    fetchErrors.push(
      `package_option_group_items: ${optionQueryDebug.itemsError.message}`,
    )
  }

  const packageConfiguration = packageConfigurationRes.data ?? {
    packageItems: [],
    packageSideItems: [],
    optionGroups: [],
    optionGroupItems: [],
  }

  const customers = (customersRes.data ?? []) as Customer[]
  const additionalItems = (additionalRes.data ?? []) as unknown as AdditionalItem[]

  return (
    <QuoteWizard
      customers={customers}
      packages={packages}
      additionalItems={additionalItems}
      packageOptionGroups={packageConfiguration.optionGroups}
      packageOptionGroupItems={packageConfiguration.optionGroupItems}
      packageOptionQueryDebug={packageConfigurationRes.optionQueryDebug ?? null}
      packageItems={packageConfiguration.packageItems}
      packageSideItems={packageConfiguration.packageSideItems}
      commercialRules={commercialRules}
      fetchErrors={fetchErrors}
    />
  )
}
