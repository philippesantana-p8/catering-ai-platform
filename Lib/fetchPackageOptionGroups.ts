import { getCdlCompanyId } from '@/Lib/cdlCompany'
import type { PackageOptionGroup, PackageOptionGroupItem } from '@/Lib/packageOptionGroups'
import {
  PACKAGE_OPTION_GROUP_COLUMNS,
  PACKAGE_OPTION_GROUP_ITEM_COLUMNS,
} from '@/Lib/packageOptionGroupsSchema'
import { supabase } from '@/Lib/supabase'

type PackageOptionGroupRow = Omit<PackageOptionGroup, 'items'> & {
  group_key?: string | null
}

function mapItemRow(item: PackageOptionGroupItem): PackageOptionGroupItem {
  return {
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
  }
}

function mapGroupRow(
  row: PackageOptionGroupRow,
  items: PackageOptionGroupItem[],
): PackageOptionGroup {
  return {
    id: row.id,
    company_id: row.company_id,
    package_id: row.package_id,
    option_group_key:
      row.option_group_key?.trim() || row.group_key?.trim() || '',
    group_key: row.group_key,
    label_pt: row.label_pt,
    label_en: row.label_en,
    label_es: row.label_es,
    min_choices: row.min_choices,
    max_choices: row.max_choices,
    required: row.required,
    blocks_additional_items: row.blocks_additional_items,
    display_order: row.display_order,
    active: row.active,
    items: items
      .filter((item) => item.active !== false)
      .sort(
        (a, b) =>
          Number(a.display_order ?? 0) - Number(b.display_order ?? 0) ||
          (a.label_pt ?? '').localeCompare(b.label_pt ?? '', 'pt-BR'),
      )
      .map(mapItemRow),
  }
}

export async function fetchPackageOptionGroupItems(
  optionGroupIds: string[],
  options?: { includeInactive?: boolean },
) {
  const companyId = getCdlCompanyId()
  const ids = [...new Set(optionGroupIds.filter((id) => id?.trim()))]
  if (ids.length === 0) {
    return { data: [] as PackageOptionGroupItem[], error: null }
  }

  let query = supabase
    .from('package_option_group_items')
    .select(PACKAGE_OPTION_GROUP_ITEM_COLUMNS.join(', '))
    .in('option_group_id', ids)
    .order('display_order', { ascending: true })

  if (!options?.includeInactive) {
    query = query.eq('active', true)
  }

  if (companyId?.trim()) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query
  if (error) {
    return { data: null as PackageOptionGroupItem[] | null, error }
  }

  return {
    data: (data ?? []) as unknown as PackageOptionGroupItem[],
    error: null,
  }
}

export async function fetchPackageOptionGroups(options?: {
  packageId?: string | null
  packageIds?: string[] | null
  includeInactive?: boolean
}) {
  const companyId = getCdlCompanyId()

  let query = supabase
    .from('package_option_groups')
    .select(PACKAGE_OPTION_GROUP_COLUMNS.join(', '))
    .order('display_order', { ascending: true })

  if (!options?.includeInactive) {
    query = query.eq('active', true)
  }

  if (companyId?.trim()) {
    query = query.eq('company_id', companyId)
  }

  if (options?.packageId?.trim()) {
    query = query.eq('package_id', options.packageId.trim())
  } else if (options?.packageIds?.length) {
    query = query.in('package_id', options.packageIds)
  }

  const { data: groupRows, error: groupsError } = await query

  if (groupsError) {
    return { data: null as PackageOptionGroup[] | null, error: groupsError }
  }

  const rows = (groupRows ?? []) as unknown as PackageOptionGroupRow[]
  const groupIds = rows.map((row) => row.id)

  const itemsRes = await fetchPackageOptionGroupItems(groupIds, {
    includeInactive: options?.includeInactive,
  })
  if (itemsRes.error) {
    return { data: null, error: itemsRes.error }
  }

  const itemsByGroup = new Map<string, PackageOptionGroupItem[]>()
  for (const item of itemsRes.data ?? []) {
    const groupId = item.option_group_id
    if (!groupId) continue
    const list = itemsByGroup.get(groupId) ?? []
    list.push(item)
    itemsByGroup.set(groupId, list)
  }

  return {
    data: rows.map((row) => mapGroupRow(row, itemsByGroup.get(row.id) ?? [])),
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
