import type { QuoteLanguage } from './quoteWizardTypes'

export type PackageCatalogVariant = 'without_sides' | 'with_sides' | 'custom'

export type PackageCatalogFields = {
  package_key?: string | null
  package_name?: string | null
  label_pt?: string | null
  label_en?: string | null
  label_es?: string | null
  name_pt?: string | null
  name_en?: string | null
  name_es?: string | null
  price_per_person?: number | null
  price?: number | null
  base_price?: number | null
  image_url?: string | null
}

export function getPackageCatalogVariant(
  pkg: PackageCatalogFields,
): PackageCatalogVariant {
  const key = (pkg.package_key ?? '').trim().toUpperCase()
  if (key.includes('PERS')) return 'custom'
  if (key.endsWith('+')) return 'with_sides'
  return 'without_sides'
}

export function getPackageCatalogName(
  pkg: PackageCatalogFields,
  language: QuoteLanguage = 'pt',
): string {
  if (language === 'en') {
    return (
      pkg.label_en ??
      pkg.name_en ??
      pkg.package_name ??
      pkg.label_pt ??
      '—'
    )
  }
  if (language === 'es') {
    return (
      pkg.label_es ??
      pkg.name_es ??
      pkg.package_name ??
      pkg.label_pt ??
      '—'
    )
  }
  return (
    pkg.label_pt ??
    pkg.name_pt ??
    pkg.package_name ??
    pkg.label_en ??
    '—'
  )
}

export function getPackageCatalogImage(pkg: PackageCatalogFields): string | null {
  return pkg.image_url?.trim() || null
}

export function getPackageCatalogPrice(pkg: PackageCatalogFields): number {
  return Number(pkg.price_per_person ?? pkg.price ?? pkg.base_price ?? 0)
}

export function isPackageCatalogPriceOnRequest(
  pkg: PackageCatalogFields,
): boolean {
  if (getPackageCatalogVariant(pkg) !== 'custom') return false
  const price = getPackageCatalogPrice(pkg)
  return !Number.isFinite(price) || price <= 0
}

function perPersonSuffix(language: QuoteLanguage): string {
  if (language === 'en') return 'person'
  if (language === 'es') return 'persona'
  return 'pessoa'
}

export function getPackageCatalogPriceOnRequestLabel(
  language: QuoteLanguage,
): string {
  if (language === 'en') return 'Price on request'
  if (language === 'es') return 'Bajo consulta'
  return 'Sob Consulta'
}

export function formatPackageCatalogPriceLabel(
  pkg: PackageCatalogFields,
  language: QuoteLanguage,
  formatCurrency: (value: number) => string,
): string {
  if (isPackageCatalogPriceOnRequest(pkg)) {
    return getPackageCatalogPriceOnRequestLabel(language)
  }

  return `${formatCurrency(getPackageCatalogPrice(pkg))} / ${perPersonSuffix(language)}`
}

export function getPackageSidesSummary(language: QuoteLanguage): string {
  if (language === 'en') return 'Includes selected side dishes'
  if (language === 'es') return 'Incluye guarniciones seleccionadas'
  return 'Inclui guarnições selecionadas'
}
