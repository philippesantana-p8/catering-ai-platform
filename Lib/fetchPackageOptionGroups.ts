import { getCdlCompanyId } from '@/Lib/cdlCompany'
import type {
  PackageOptionGroup,
  PackageOptionGroupItem,
  PackageOptionGroupRecord,
} from '@/Lib/packageOptionGroups'
import { mergeOptionGroupsForPackage } from '@/Lib/packageOptionGroups'
import {
  PACKAGE_OPTION_GROUP_COLUMNS,
  PACKAGE_OPTION_GROUP_ITEM_COLUMNS,
} from '@/Lib/packageOptionGroupsSchema'
import { supabase } from '@/Lib/supabase'

function mapGroupRecord(row: PackageOptionGroupRecord): PackageOptionGroupRecord {
  return {
    ...row,
    option_group_key:
      row.option_group_key?.trim() || row.group_key?.trim() || '',
  }
}

/** Etapa A — grupos sem join aninhado. */
export async function fetchPackageOptionGroupsOnly(options?: {
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

  const { data, error } = await query
  if (error) {
    return { data: null as PackageOptionGroupRecord[] | null, error }
  }

  return {
    data: ((data ?? []) as unknown as PackageOptionGroupRecord[]).map(
      mapGroupRecord,
    ),
    error: null,
  }
}

/** Etapa B — itens por option_group_id (não chama .in vazio). */
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

/** Busca em duas etapas — fonte única para cotação. */
export async function loadPackageOptionChoices(options?: {
  packageId?: string | null
  packageIds?: string[] | null
  includeInactive?: boolean
}) {
  const groupsRes = await fetchPackageOptionGroupsOnly(options)
  if (groupsRes.error) {
    return {
      groups: [] as PackageOptionGroupRecord[],
      groupItems: [] as PackageOptionGroupItem[],
      error: groupsRes.error,
    }
  }

  const groups = groupsRes.data ?? []
  const groupIds = groups.map((group) => group.id)

  if (groupIds.length === 0) {
    return { groups, groupItems: [] as PackageOptionGroupItem[], error: null }
  }

  const itemsRes = await fetchPackageOptionGroupItems(groupIds, {
    includeInactive: options?.includeInactive,
  })

  return {
    groups,
    groupItems: itemsRes.data ?? [],
    error: itemsRes.error ?? null,
  }
}

/** Compat — grupos com items anexados no código. */
export async function fetchPackageOptionGroups(options?: {
  packageId?: string | null
  packageIds?: string[] | null
  includeInactive?: boolean
}) {
  const { groups, groupItems, error } = await loadPackageOptionChoices(options)
  if (error) {
    return { data: null as PackageOptionGroup[] | null, error }
  }

  const packageIds = options?.packageId?.trim()
    ? [options.packageId.trim()]
    : options?.packageIds?.filter(Boolean) ?? [
        ...new Set(groups.map((g) => g.package_id).filter(Boolean)),
      ]

  const hydrated = packageIds.flatMap((packageId) =>
    mergeOptionGroupsForPackage(packageId, groups, groupItems, {
      includeEmptyGroups: true,
    }),
  )

  return { data: hydrated, error: null }
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
