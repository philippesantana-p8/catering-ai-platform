import { getCdlCompanyId } from './cdlCompany'
import { buildPackagesListSelect } from './packagesTableSchema'
import { supabase } from './supabase'

export type PackageListItem = {
  id: string
  package_key?: string | null
  package_name?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  items_description_pt?: string | null
  items_description_en?: string | null
  items_description_es?: string | null
  garnish_description_pt?: string | null
  garnish_description_en?: string | null
  garnish_description_es?: string | null
  card_description_pt?: string | null
  card_description_en?: string | null
  card_description_es?: string | null
  package_type?: string | null
  base_package_code?: string | null
  has_garnish?: boolean | null
  garnish_price_per_person?: number | null
  cost_per_person?: number | null
  margin_percent?: number | null
  inventory_enabled?: boolean | null
  price_per_person?: number | null
  currency_code?: string | null
  display_order?: number | null
  image_url?: string | null
  active?: boolean | null
  updated_at?: string | null
}

type FetchPackagesOptions = {
  activeOnly?: boolean
  includeInactive?: boolean
}

export async function fetchPackages(options: FetchPackagesOptions = {}) {
  const companyId = getCdlCompanyId()

  let query = supabase
    .from('packages')
    .select(buildPackagesListSelect())
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('label_pt', { ascending: true })

  if (companyId?.trim()) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`)
  }

  if (options.activeOnly) {
    query = query.eq('active', true)
  }

  const { data, error } = await query

  if (error) {
    return { data: null as PackageListItem[] | null, error }
  }

  let rows = (data ?? []) as unknown as PackageListItem[]

  if (!options.includeInactive && !options.activeOnly) {
    rows = rows.filter((row) => row.active !== false)
  }

  return { data: rows, error: null }
}
