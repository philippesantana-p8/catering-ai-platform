import type { PackagesInsertPayload } from '@/Lib/packagesTableSchema'
import { pickPackagesInsertPayload, stripPackagesUpgradeFields } from '@/Lib/packagesTableSchema'

export type PackageFieldSource = {
  package_key?: string | null
  package_name?: string | null
  label_pt?: string | null
  description?: string | null
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  items_description_pt?: string | null
  items_description_en?: string | null
  items_description_es?: string | null
  garnish_description_pt?: string | null
  card_description_pt?: string | null
  card_description_en?: string | null
  card_description_es?: string | null
  has_garnish?: boolean | null
  garnish_price_per_person?: number | null
  cost_per_person?: number | null
  margin_percent?: number | null
  inventory_enabled?: boolean | null
  package_type?: string | null
  base_package_code?: string | null
}

export function getPackageItemsDescription(
  pkg: PackageFieldSource | null | undefined,
  language: 'pt' | 'en' | 'es' = 'pt',
): string {
  if (!pkg) return ''
  if (language === 'en') {
    return (
      pkg.items_description_en?.trim() ||
      pkg.description_en?.trim() ||
      pkg.description_pt?.trim() ||
      pkg.description?.trim() ||
      ''
    )
  }
  if (language === 'es') {
    return (
      pkg.items_description_es?.trim() ||
      pkg.description_es?.trim() ||
      pkg.description_pt?.trim() ||
      pkg.description?.trim() ||
      ''
    )
  }
  return (
    pkg.items_description_pt?.trim() ||
    pkg.description_pt?.trim() ||
    pkg.description?.trim() ||
    ''
  )
}

export function getPackageCardDescription(
  pkg: PackageFieldSource | null | undefined,
  language: 'pt' | 'en' | 'es' = 'pt',
): string {
  if (!pkg) return ''
  if (language === 'en') {
    return pkg.card_description_en?.trim() || getPackageItemsDescription(pkg, 'en')
  }
  if (language === 'es') {
    return pkg.card_description_es?.trim() || getPackageItemsDescription(pkg, 'es')
  }
  return pkg.card_description_pt?.trim() || getPackageItemsDescription(pkg, 'pt')
}

export function getPackageGarnishDescription(
  pkg: PackageFieldSource | null | undefined,
): string {
  return pkg?.garnish_description_pt?.trim() || ''
}

export function getPackageHasGarnish(pkg: PackageFieldSource | null | undefined): boolean {
  if (!pkg) return false
  if (pkg.has_garnish === true) return true

  const packageKey = (pkg.package_key ?? '').trim()
  if (packageKey.endsWith('+')) return true

  const name = `${pkg.label_pt ?? ''} ${pkg.package_name ?? ''}`.toLowerCase()
  return name.includes('guarni')
}

export function getPackageGarnishPricePerPerson(
  pkg: PackageFieldSource | null | undefined,
): number {
  return Number(pkg?.garnish_price_per_person ?? 0)
}

export function getPackageCostPerPerson(
  pkg: PackageFieldSource | null | undefined,
): number {
  return Number(pkg?.cost_per_person ?? 0)
}

export function getPackageMarginPercent(
  pkg: PackageFieldSource | null | undefined,
): number {
  return Number(pkg?.margin_percent ?? 0)
}

/** Mapeia rascunho do formulário premium para colunas deployadas no Supabase. */
export function mapPackageDraftToDeployed(
  draft: Record<string, unknown>,
): PackagesInsertPayload {
  const itemsPt = draft.items_description_pt?.toString().trim()
  const descriptionPt = draft.description_pt?.toString().trim()

  const deployed: PackagesInsertPayload = {
    ...stripPackagesUpgradeFields(draft),
    description_pt: itemsPt || descriptionPt || undefined,
    description_en: draft.description_en?.toString().trim() || undefined,
    description_es: draft.description_es?.toString().trim() || undefined,
  }

  return pickPackagesInsertPayload(deployed)
}
