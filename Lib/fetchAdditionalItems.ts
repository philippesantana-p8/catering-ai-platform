import { getCdlCompanyId } from './cdlCompany'
import { buildAdditionalItemsListSelect } from './additionalItemsTableSchema'
import { supabase } from './supabase'

export type AdditionalItemListItem = {
  id: string
  item_key?: string | null
  item_name?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  category_pt?: string | null
  category_group?: string | null
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  price?: number | null
  cost?: number | null
  margin_percent?: number | null
  charge_type?: string | null
  pricing_type?: string | null
  unit_label?: string | null
  currency_code?: string | null
  display_order?: number | null
  image_url?: string | null
  image_status?: string | null
  image_notes?: string | null
  inventory_enabled?: boolean | null
  supplier_name?: string | null
  internal_notes?: string | null
  active?: boolean | null
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
    .order('item_name', { ascending: true })

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
