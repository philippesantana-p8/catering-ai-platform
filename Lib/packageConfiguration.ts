import { getCdlCompanyId } from '@/Lib/cdlCompany'
import {
  loadPackageOptionChoices,
  resolvePackageIdsForQuery,
  type PackageOptionQueryDebug,
} from '@/Lib/fetchPackageOptionGroups'
import type {
  PackageOptionGroupItem,
  PackageOptionGroupRecord,
} from '@/Lib/packageOptionGroups'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'
import { getSupabaseServerClient } from '@/Lib/supabaseServer'

export type PackageItem = {
  id: string
  company_id?: string | null
  package_id: string
  additional_item_id?: string | null
  item_key: string
  item_name?: string | null
  label_pt: string
  label_en?: string | null
  label_es?: string | null
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  quantity?: number | null
  unit_label_pt?: string | null
  unit_label_en?: string | null
  unit_label_es?: string | null
  included?: boolean | null
  is_choice_placeholder?: boolean | null
  blocks_additional_item?: boolean | null
  display_order?: number | null
  active?: boolean | null
}

export type PackageSideItem = {
  id: string
  company_id?: string | null
  package_id: string
  additional_item_id?: string | null
  item_key: string
  item_name?: string | null
  label_pt: string
  label_en?: string | null
  label_es?: string | null
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  quantity?: number | null
  unit_label_pt?: string | null
  unit_label_en?: string | null
  unit_label_es?: string | null
  included?: boolean | null
  blocks_additional_item?: boolean | null
  display_order?: number | null
  active?: boolean | null
}

export type PackageConfiguration = {
  packageItems: PackageItem[]
  packageSideItems: PackageSideItem[]
  /** Grupos flat — itens anexados via mergeOptionGroupsForPackage */
  optionGroups: PackageOptionGroupRecord[]
  optionGroupItems: PackageOptionGroupItem[]
}

export const PACKAGE_ITEM_COLUMNS = [
  'id',
  'company_id',
  'package_id',
  'additional_item_id',
  'item_key',
  'item_name',
  'label_pt',
  'label_en',
  'label_es',
  'description_pt',
  'description_en',
  'description_es',
  'quantity',
  'unit_label_pt',
  'unit_label_en',
  'unit_label_es',
  'included',
  'is_choice_placeholder',
  'blocks_additional_item',
  'display_order',
  'active',
] as const

export const PACKAGE_SIDE_ITEM_COLUMNS = [
  'id',
  'company_id',
  'package_id',
  'additional_item_id',
  'item_key',
  'item_name',
  'label_pt',
  'label_en',
  'label_es',
  'description_pt',
  'description_en',
  'description_es',
  'quantity',
  'unit_label_pt',
  'unit_label_en',
  'unit_label_es',
  'included',
  'blocks_additional_item',
  'display_order',
  'active',
] as const

export function buildPackageItemsSelect(): string {
  return PACKAGE_ITEM_COLUMNS.join(',\n      ')
}

export function buildPackageSideItemsSelect(): string {
  return PACKAGE_SIDE_ITEM_COLUMNS.join(',\n      ')
}

function sortPackageItems<T extends PackageItem | PackageSideItem>(
  items: T[],
): T[] {
  return [...items]
    .filter((item) => item.active !== false && item.included !== false)
    .sort(
      (a, b) =>
        Number(a.display_order ?? 0) - Number(b.display_order ?? 0) ||
        a.item_key.localeCompare(b.item_key),
    )
}

export function getPackageItemLabel(
  item: PackageItem,
  language: QuoteLanguage = 'pt',
): string {
  if (language === 'en') {
    return item.label_en?.trim() || item.label_pt?.trim() || item.item_key
  }
  if (language === 'es') {
    return item.label_es?.trim() || item.label_pt?.trim() || item.item_key
  }
  return item.label_pt?.trim() || item.item_key
}

export function getPackageSideItemLabel(
  item: PackageSideItem,
  language: QuoteLanguage = 'pt',
): string {
  if (language === 'en') {
    return item.label_en?.trim() || item.label_pt?.trim() || item.item_key
  }
  if (language === 'es') {
    return item.label_es?.trim() || item.label_pt?.trim() || item.item_key
  }
  return item.label_pt?.trim() || item.item_key
}

export function getPackageItemsForPackage(
  packageId: string,
  items: ReadonlyArray<PackageItem>,
): PackageItem[] {
  if (!packageId?.trim()) return []
  const normalizedId = packageId.trim()
  return sortPackageItems(
    items.filter((item) => item.package_id?.trim() === normalizedId),
  )
}

export function getPackageSideItemsForPackage(
  packageId: string,
  sides: ReadonlyArray<PackageSideItem>,
): PackageSideItem[] {
  if (!packageId?.trim()) return []
  const normalizedId = packageId.trim()
  return sortPackageItems(
    sides.filter((side) => side.package_id?.trim() === normalizedId),
  )
}

export function formatPackageItemsText(
  items: ReadonlyArray<PackageItem>,
  language: QuoteLanguage = 'pt',
): string {
  const labels = sortPackageItems([...items]).map((item) =>
    getPackageItemLabel(item, language),
  )
  return labels.filter(Boolean).join(' • ')
}

export function formatPackageSideItemsText(
  sides: ReadonlyArray<PackageSideItem>,
  language: QuoteLanguage = 'pt',
): string {
  const labels = sortPackageItems([...sides]).map((side) =>
    getPackageSideItemLabel(side, language),
  )
  return labels.filter(Boolean).join(' • ')
}

/** Lista legível com separador · (itens fixos / guarnições). */
export function formatPackageInventoryList(
  labels: ReadonlyArray<string>,
): string {
  return labels.filter(Boolean).join(' · ')
}

function optionGroupsForPackage(
  packageId: string,
  groups: ReadonlyArray<PackageOptionGroupRecord & { items?: PackageOptionGroupItem[] }>,
) {
  if (!packageId?.trim()) return []
  const normalizedId = packageId.trim()
  return groups
    .filter(
      (group) =>
        group.package_id?.trim() === normalizedId && group.active !== false,
    )
    .sort(
      (a, b) =>
        Number(a.display_order ?? 0) - Number(b.display_order ?? 0) ||
        a.option_group_key.localeCompare(b.option_group_key),
    )
}

export function getBlockedAdditionalItemIdsFromConfig({
  packageId,
  packageItems,
  packageSideItems,
  optionGroups,
  customPackage,
}: {
  packageId: string
  packageItems: ReadonlyArray<PackageItem>
  packageSideItems: ReadonlyArray<PackageSideItem>
  optionGroups: ReadonlyArray<PackageOptionGroupRecord & { items?: PackageOptionGroupItem[] }>
  customPackage: boolean
}): string[] {
  if (customPackage || !packageId?.trim()) return []

  const blocked = new Set<string>()

  for (const item of getPackageItemsForPackage(packageId, packageItems)) {
    if (item.blocks_additional_item && item.additional_item_id?.trim()) {
      blocked.add(item.additional_item_id.trim())
    }
  }

  for (const side of getPackageSideItemsForPackage(packageId, packageSideItems)) {
    if (side.blocks_additional_item && side.additional_item_id?.trim()) {
      blocked.add(side.additional_item_id.trim())
    }
  }

  for (const group of optionGroupsForPackage(packageId, optionGroups)) {
    if (group.blocks_additional_items === false) continue
    for (const item of group.items ?? []) {
      if (item.active === false) continue
      const additionalId = item.additional_item_id?.trim()
      if (additionalId) blocked.add(additionalId)
    }
  }

  return [...blocked]
}

export async function fetchPackageItems(options?: {
  packageId?: string | null
  packageIds?: string[] | null
}) {
  const companyId = getCdlCompanyId().trim()
  const packageIds = resolvePackageIdsForQuery(options)
  const supabase = getSupabaseServerClient()

  let query = supabase
    .from('package_items')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  if (packageIds.length > 0) {
    query = query.in('package_id', packageIds)
  }

  const { data, error } = await query

  if (error) {
    return { data: null as PackageItem[] | null, error }
  }

  return {
    data: (data ?? []) as unknown as PackageItem[],
    error: null,
  }
}

export async function fetchPackageSideItems(options?: {
  packageId?: string | null
  packageIds?: string[] | null
}) {
  const companyId = getCdlCompanyId().trim()
  const packageIds = resolvePackageIdsForQuery(options)
  const supabase = getSupabaseServerClient()

  let query = supabase
    .from('package_side_items')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  if (packageIds.length > 0) {
    query = query.in('package_id', packageIds)
  }

  const { data, error } = await query

  if (error) {
    return { data: null as PackageSideItem[] | null, error }
  }

  return {
    data: (data ?? []) as unknown as PackageSideItem[],
    error: null,
  }
}

export async function loadPackageConfiguration(options?: {
  packageIds?: string[] | null
}) {
  const packageIds = options?.packageIds?.filter((id) => id?.trim()) ?? null

  const queryScope = packageIds?.length ? { packageIds } : undefined

  const [itemsRes, sidesRes, choicesRes] = await Promise.all([
    fetchPackageItems(queryScope),
    fetchPackageSideItems(queryScope),
    loadPackageOptionChoices(queryScope),
  ])

  const error =
    itemsRes.error ?? sidesRes.error ?? choicesRes.error ?? null

  let packageItems = itemsRes.data ?? []
  let packageSideItems = sidesRes.data ?? []
  let optionGroups = choicesRes.groups ?? []
  let optionGroupItems = choicesRes.groupItems ?? []

  if (packageIds && packageIds.length > 0) {
    const idSet = new Set(packageIds)
    packageItems = packageItems.filter((item) => idSet.has(item.package_id))
    packageSideItems = packageSideItems.filter((side) =>
      idSet.has(side.package_id),
    )
    optionGroups = optionGroups.filter((group) => idSet.has(group.package_id))
    const groupIdSet = new Set(optionGroups.map((group) => group.id))
    optionGroupItems = optionGroupItems.filter((item) =>
      groupIdSet.has(item.option_group_id),
    )
  }

  return {
    data: {
      packageItems,
      packageSideItems,
      optionGroups,
      optionGroupItems,
    } satisfies PackageConfiguration,
    optionQueryDebug: choicesRes.queryDebug,
    error,
  }
}
