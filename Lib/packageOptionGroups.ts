import { getPackageKey, type PackageFieldSource } from '@/Lib/packageFieldAccess'
import {
  getBlockedAdditionalItemIdsFromConfig,
  type PackageItem,
  type PackageSideItem,
} from '@/Lib/packageConfiguration'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

export type PackageOptionGroupItem = {
  id: string
  company_id?: string | null
  option_group_id: string
  additional_item_id?: string | null
  option_item_key?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  display_order?: number | null
  active?: boolean | null
  price_delta?: number | null
}

export type PackageOptionGroup = {
  id: string
  company_id?: string | null
  package_id: string
  option_group_key: string
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  min_choices?: number | null
  max_choices?: number | null
  required?: boolean | null
  blocks_additional_items?: boolean | null
  display_order?: number | null
  active?: boolean | null
  items: PackageOptionGroupItem[]
}

export type QuotePackageSelection = {
  id: string
  company_id?: string | null
  quote_id: string
  package_id: string
  option_group_id: string
  option_item_id: string
}

export type PackageSelectionLabel = {
  groupId: string
  groupTitle: string
  itemId: string
  itemLabel: string
}

export function getOptionItemLabel(
  item: PackageOptionGroupItem,
  language: QuoteLanguage = 'pt',
): string {
  if (language === 'en') {
    return (
      item.label_en?.trim() ||
      item.label_pt?.trim() ||
      item.option_item_key?.trim() ||
      '—'
    )
  }
  if (language === 'es') {
    return (
      item.label_es?.trim() ||
      item.label_pt?.trim() ||
      item.option_item_key?.trim() ||
      '—'
    )
  }
  return item.label_pt?.trim() || item.option_item_key?.trim() || '—'
}

export function getOptionGroupTitle(
  group: PackageOptionGroup,
  language: QuoteLanguage = 'pt',
): string {
  if (language === 'en') {
    return (
      group.label_en?.trim() ||
      group.label_pt?.trim() ||
      group.option_group_key
    )
  }
  if (language === 'es') {
    return (
      group.label_es?.trim() ||
      group.label_pt?.trim() ||
      group.option_group_key
    )
  }
  return group.label_pt?.trim() || group.option_group_key
}

export function isCustomPackage(
  pkg: PackageFieldSource | null | undefined,
): boolean {
  const key = getPackageKey(pkg).toUpperCase()
  return key.includes('PERS') || key.includes('BBQPERS')
}

function sortGroups(groups: PackageOptionGroup[]): PackageOptionGroup[] {
  return [...groups]
    .filter((group) => group.active !== false)
    .sort(
      (a, b) =>
        Number(a.display_order ?? 0) - Number(b.display_order ?? 0) ||
        a.option_group_key.localeCompare(b.option_group_key),
    )
    .map((group) => ({
      ...group,
      items: [...(group.items ?? [])]
        .filter((item) => item.active !== false)
        .sort(
          (a, b) =>
            Number(a.display_order ?? 0) - Number(b.display_order ?? 0) ||
            getOptionItemLabel(a).localeCompare(getOptionItemLabel(b), 'pt-BR'),
        ),
    }))
}

export function getPackageOptionGroupsForPackage(
  packageId: string,
  groups: ReadonlyArray<PackageOptionGroup>,
): PackageOptionGroup[] {
  if (!packageId?.trim()) return []
  return sortGroups(groups.filter((group) => group.package_id === packageId))
}

export function getBlockedAdditionalItemIds(
  packageId: string,
  groups: ReadonlyArray<PackageOptionGroup>,
  customPackage: boolean,
  options?: {
    packageItems?: ReadonlyArray<PackageItem>
    packageSideItems?: ReadonlyArray<PackageSideItem>
  },
): string[] {
  return getBlockedAdditionalItemIdsFromConfig({
    packageId,
    packageItems: options?.packageItems ?? [],
    packageSideItems: options?.packageSideItems ?? [],
    optionGroups: groups,
    customPackage,
  })
}

export function getPendingPackageSelectionGroupIds(
  groups: ReadonlyArray<PackageOptionGroup>,
  selections: Record<string, string>,
): string[] {
  return sortGroups([...groups])
    .filter((group) => group.required && !selections[group.id]?.trim())
    .map((group) => group.id)
}

export function validatePackageSelections(
  groups: ReadonlyArray<PackageOptionGroup>,
  selections: Record<string, string>,
): string[] {
  const issues: string[] = []

  for (const group of sortGroups([...groups])) {
    if (!group.required) continue
    const selected = selections[group.id]?.trim()
    if (!selected) {
      const title = getOptionGroupTitle(group)
      issues.push(`Escolha uma opção em: ${title}.`)
    }
  }

  return issues
}

function buildGroupPlaceholderPattern(
  group: PackageOptionGroup,
  language: QuoteLanguage,
): string | null {
  const labels = group.items
    .map((item) => getOptionItemLabel(item, language))
    .filter(Boolean)
  if (labels.length === 0) return null
  if (labels.length === 1) return labels[0]
  return labels.join(' ou ')
}

export function resolvePackageItemsWithSelections(
  itemsText: string,
  selections: Record<string, string>,
  groups: ReadonlyArray<PackageOptionGroup>,
  language: QuoteLanguage = 'pt',
): string {
  let result = itemsText

  for (const group of sortGroups([...groups])) {
    const selectedId = selections[group.id]?.trim()
    if (!selectedId) continue

    const selectedItem = group.items.find((item) => item.id === selectedId)
    if (!selectedItem) continue

    const selectedLabel = getOptionItemLabel(selectedItem, language)
    const pattern = buildGroupPlaceholderPattern(group, language)
    if (pattern && result.includes(pattern)) {
      result = result.replace(pattern, selectedLabel)
      continue
    }

    const bulletPattern = group.items
      .map((item) => getOptionItemLabel(item, language))
      .filter(Boolean)
      .join(' • ')
    if (bulletPattern && result.includes(bulletPattern)) {
      result = result.replace(bulletPattern, selectedLabel)
      continue
    }

    const keyPattern = group.items
      .map((item) => item.option_item_key?.trim())
      .filter(Boolean)
      .join(' ou ')
    if (keyPattern && result.includes(keyPattern)) {
      result = result.replace(
        keyPattern,
        selectedItem.option_item_key?.trim() || selectedLabel,
      )
    }
  }

  return result
}

export function buildPackageSelectionLabels(
  selections: Record<string, string>,
  groups: ReadonlyArray<PackageOptionGroup>,
  language: QuoteLanguage = 'pt',
): PackageSelectionLabel[] {
  const labels: PackageSelectionLabel[] = []

  for (const group of sortGroups([...groups])) {
    const selectedId = selections[group.id]?.trim()
    if (!selectedId) continue
    const item = group.items.find((row) => row.id === selectedId)
    if (!item) continue
    labels.push({
      groupId: group.id,
      groupTitle: getOptionGroupTitle(group, language),
      itemId: item.id,
      itemLabel: getOptionItemLabel(item, language),
    })
  }

  return labels
}

export function packageSelectionsFromRows(
  rows: ReadonlyArray<Pick<QuotePackageSelection, 'option_group_id' | 'option_item_id'>>,
): Record<string, string> {
  const selections: Record<string, string> = {}
  for (const row of rows) {
    if (row.option_group_id && row.option_item_id) {
      selections[row.option_group_id] = row.option_item_id
    }
  }
  return selections
}

export function prunePackageSelectionsForPackage(
  packageId: string,
  selections: Record<string, string>,
  groups: ReadonlyArray<PackageOptionGroup>,
): Record<string, string> {
  const validGroupIds = new Set(
    getPackageOptionGroupsForPackage(packageId, groups).map((group) => group.id),
  )
  const next: Record<string, string> = {}
  for (const [groupId, itemId] of Object.entries(selections)) {
    if (validGroupIds.has(groupId) && itemId?.trim()) {
      next[groupId] = itemId
    }
  }
  return next
}
