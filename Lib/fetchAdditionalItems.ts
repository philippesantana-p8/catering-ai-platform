import { getCdlCompanyId } from './cdlCompany'
import { buildAdditionalItemsListSelect } from './additionalItemsTableSchema'
import { supabase } from './supabase'

export type AdditionalItemListItem = {
  id: string
  item_key?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  category_pt?: string | null
  category_en?: string | null
  category_es?: string | null
  price?: number | null
  price_per_person?: number | null
  price_per_unit?: number | null
  amount?: number | null
  pricing_type?: string | null
  charge_type?: string | null
  quantity?: number | null
  unit?: string | null
  quantity_2?: number | null
  uom_2?: string | null
  unit_label?: string | null
  display_order?: number | null
  image_url?: string | null
  active?: boolean | null
  updated_at?: string | null
}

type FetchAdditionalItemsOptions = {
  activeOnly?: boolean
  includeInactive?: boolean
}

export async function fetchAdditionalItems(
  options: FetchAdditionalItemsOptions = {},
) {
  const companyId = getCdlCompanyId()

  let query = supabase
    .from('additional_items')
    .select(buildAdditionalItemsListSelect())
    .order('category_pt', { ascending: true, nullsFirst: false })
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
    return { data: null as AdditionalItemListItem[] | null, error }
  }

  let rows = (data ?? []) as unknown as AdditionalItemListItem[]

  if (!options.includeInactive && !options.activeOnly) {
    rows = rows.filter((row) => row.active !== false)
  }

  return { data: rows, error: null }
}
