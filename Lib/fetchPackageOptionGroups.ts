import { getCdlCompanyId } from '@/Lib/cdlCompany'
import type {
  PackageOptionGroup,
  PackageOptionGroupItem,
  PackageOptionGroupRecord,
} from '@/Lib/packageOptionGroups'
import { mergeOptionGroupsForPackage } from '@/Lib/packageOptionGroups'
import { supabase } from '@/Lib/supabase'

/** CDL pilot: grupos/itens são por company_id + package_id apenas. */
export const PACKAGE_OPTION_BRANCH_FILTER_ENABLED = false

export type PackageOptionQueryDebug = {
  queryCompanyId: string
  packageIds: string[]
  currentBranchId: string | null
  branchFilterActive: boolean
  groupsFetched: number
  itemsFetched: number
}

function resolvePackageIdsForQuery(options?: {
  packageId?: string | null
  packageIds?: string[] | null
}): string[] {
  if (options?.packageId?.trim()) {
    return [options.packageId.trim()]
  }
  return [...new Set((options?.packageIds ?? []).map((id) => id?.trim()).filter(Boolean) as string[])]
}

function buildQueryDebug(
  options: {
    packageId?: string | null
    packageIds?: string[] | null
    currentBranchId?: string | null
  },
  counts: { groupsFetched: number; itemsFetched: number },
): PackageOptionQueryDebug {
  return {
    queryCompanyId: getCdlCompanyId(),
    packageIds: resolvePackageIdsForQuery(options),
    currentBranchId: options.currentBranchId?.trim() || null,
    branchFilterActive: PACKAGE_OPTION_BRANCH_FILTER_ENABLED,
    groupsFetched: counts.groupsFetched,
    itemsFetched: counts.itemsFetched,
  }
}

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
  /** Apenas para debug — não filtra enquanto PACKAGE_OPTION_BRANCH_FILTER_ENABLED = false */
  currentBranchId?: string | null
}) {
  const companyId = getCdlCompanyId()
  const packageIds = resolvePackageIdsForQuery(options)

  let query = supabase
    .from('package_option_groups')
    .select('*')
    .order('display_order', { ascending: true })

  if (!options?.includeInactive) {
    query = query.eq('active', true)
  }

  if (companyId?.trim()) {
    query = query.eq('company_id', companyId)
  }

  // Não usar .eq('branch_id', currentBranchId) no piloto CDL.
  // Futuro: if (PACKAGE_OPTION_BRANCH_FILTER_ENABLED && branchId) {
  //   query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`)
  // }

  if (options?.packageId?.trim()) {
    query = query.eq('package_id', options.packageId.trim())
  } else if (packageIds.length > 0) {
    query = query.in('package_id', packageIds)
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
    .select('*')
    .in('option_group_id', ids)
    .order('display_order', { ascending: true })

  if (!options?.includeInactive) {
    query = query.eq('active', true)
  }

  if (companyId?.trim()) {
    query = query.eq('company_id', companyId)
  }

  // Mesma regra do piloto CDL: sem filtro branch_id em package_option_group_items.

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
  currentBranchId?: string | null
}) {
  const groupsRes = await fetchPackageOptionGroupsOnly(options)
  if (groupsRes.error) {
    return {
      groups: [] as PackageOptionGroupRecord[],
      groupItems: [] as PackageOptionGroupItem[],
      error: groupsRes.error,
      queryDebug: buildQueryDebug(options ?? {}, {
        groupsFetched: 0,
        itemsFetched: 0,
      }),
    }
  }

  const groups = groupsRes.data ?? []
  const groupIds = groups.map((group) => group.id)

  if (groupIds.length === 0) {
    return {
      groups,
      groupItems: [] as PackageOptionGroupItem[],
      error: null,
      queryDebug: buildQueryDebug(options ?? {}, {
        groupsFetched: groups.length,
        itemsFetched: 0,
      }),
    }
  }

  const itemsRes = await fetchPackageOptionGroupItems(groupIds, {
    includeInactive: options?.includeInactive,
  })

  const groupItems = itemsRes.data ?? []

  return {
    groups,
    groupItems,
    error: itemsRes.error ?? null,
    queryDebug: buildQueryDebug(options ?? {}, {
      groupsFetched: groups.length,
      itemsFetched: groupItems.length,
    }),
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
