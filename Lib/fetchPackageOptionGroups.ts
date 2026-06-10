import { getCdlCompanyId } from '@/Lib/cdlCompany'
import type { PackageOptionGroup, PackageOptionGroupItem } from '@/Lib/packageOptionGroups'
import { buildPackageOptionGroupsSelect } from '@/Lib/packageOptionGroupsSchema'
import { supabase } from '@/Lib/supabase'

type PackageOptionGroupRow = Omit<PackageOptionGroup, 'items'> & {
  package_option_group_items?: PackageOptionGroupItem[] | null
}

function mapGroupRows(rows: PackageOptionGroupRow[]): PackageOptionGroup[] {
  return rows.map((row) => ({
    id: row.id,
    company_id: row.company_id,
    package_id: row.package_id,
    option_group_key: row.option_group_key,
    label_pt: row.label_pt,
    label_en: row.label_en,
    label_es: row.label_es,
    min_choices: row.min_choices,
    max_choices: row.max_choices,
    required: row.required,
    blocks_additional_items: row.blocks_additional_items,
    display_order: row.display_order,
    active: row.active,
    items: (row.package_option_group_items ?? [])
      .filter((item) => item.active !== false)
      .map((item) => ({
        id: item.id,
        company_id: item.company_id,
        option_group_id: item.option_group_id,
        additional_item_id: item.additional_item_id,
        option_item_key: item.option_item_key,
        label_pt: item.label_pt,
        label_en: item.label_en,
        label_es: item.label_es,
        display_order: item.display_order,
        active: item.active,
        price_delta: item.price_delta,
      })),
  }))
}

export async function fetchPackageOptionGroups(options?: {
  packageId?: string | null
}) {
  const companyId = getCdlCompanyId()

  let query = supabase
    .from('package_option_groups')
    .select(buildPackageOptionGroupsSelect())
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (companyId?.trim()) {
    query = query.eq('company_id', companyId)
  }

  if (options?.packageId?.trim()) {
    query = query.eq('package_id', options.packageId.trim())
  }

  const { data, error } = await query

  if (error) {
    return { data: null as PackageOptionGroup[] | null, error }
  }

  return {
    data: mapGroupRows((data ?? []) as unknown as PackageOptionGroupRow[]),
    error: null,
  }
}

export async function fetchQuotePackageSelections(quoteId: string) {
  const companyId = getCdlCompanyId()

  let query = supabase
    .from('quote_package_selections')
    .select(
      'id, company_id, quote_id, package_id, option_group_id, option_item_id',
    )
    .eq('quote_id', quoteId)

  if (companyId?.trim()) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error }
  }

  return { data: data ?? [], error: null }
}
