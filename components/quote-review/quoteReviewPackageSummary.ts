import {
  CDL_PACKAGES,
  PACKAGE_COMMON_ITEMS,
  SIDES_ITEMS,
} from '@/Lib/cdlCommercialRules'
import {
  findBasePackage,
  getPackageCatalogPrice,
  getPackageCatalogVariant,
  getPackageSidesDescription,
  resolvePackageSidesPricing,
  type PackageCatalogFields,
} from '@/Lib/packageCatalogVisual'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

export type QuoteReviewPackageFields = PackageCatalogFields & {
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
  description?: string | null
}

export type QuoteReviewPackageSummaryInput = {
  pkg: QuoteReviewPackageFields | null
  allPackages?: ReadonlyArray<PackageCatalogFields>
  sidesPricePerPerson: number
  chargedPeople: number
  fromWithSidesSection?: boolean
  language?: QuoteLanguage
}

export type QuoteReviewPackageSummary = {
  hasGarnish: boolean
  packageItemsDescription: string | null
  garnishDescription: string
  packageUnitPrice: number
  garnishUnitPrice: number
  totalUnitPrice: number
  chargedPeople: number
  packageTotalPrice: number
  garnishTotalPrice: number
  grandTotalPrice: number
}

const DESCRIPTION_SECTION_MARKERS = [
  'Todos os pacotes acompanham:',
  'Guarnições inclusas',
  'Guarnições:',
] as const

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function getDescriptionText(
  pkg: QuoteReviewPackageFields,
  language: QuoteLanguage = 'pt',
): string {
  if (language === 'en') {
    return (
      pkg.description_en?.trim() ||
      pkg.description_pt?.trim() ||
      pkg.description?.trim() ||
      ''
    )
  }
  if (language === 'es') {
    return (
      pkg.description_es?.trim() ||
      pkg.description_pt?.trim() ||
      pkg.description?.trim() ||
      ''
    )
  }
  return (
    pkg.description_pt?.trim() ||
    pkg.description_en?.trim() ||
    pkg.description_es?.trim() ||
    pkg.description?.trim() ||
    ''
  )
}

function parseBulletItems(section: string): string[] {
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('•'))
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean)
}

function extractDescriptionSection(
  description: string,
  header: string,
): string | null {
  const idx = description.indexOf(header)
  if (idx === -1) return null

  const rest = description.slice(idx + header.length)
  let end = rest.length

  for (const marker of DESCRIPTION_SECTION_MARKERS) {
    const markerIndex = rest.indexOf(marker)
    if (markerIndex !== -1 && markerIndex < end) {
      end = markerIndex
    }
  }

  const section = rest.slice(0, end).trim()
  return section || null
}

function formatItemsList(items: readonly string[]): string {
  return items.join(', ')
}

function getCdlPackageDefinition(packageKey: string | null | undefined) {
  const normalizedKey = (packageKey ?? '').trim().replace(/\+$/, '')
  if (!normalizedKey) return null
  return CDL_PACKAGES.find((pkg) => pkg.package_key === normalizedKey) ?? null
}

export function packageItemsDescription(
  pkg: QuoteReviewPackageFields | null,
  language: QuoteLanguage = 'pt',
): string | null {
  if (!pkg) return null

  const description = getDescriptionText(pkg, language)
  if (description) {
    const packageSection = extractDescriptionSection(description, 'Itens do pacote:')
    const commonSection = extractDescriptionSection(
      description,
      'Todos os pacotes acompanham:',
    )
    const packageItems = packageSection ? parseBulletItems(packageSection) : []
    const commonItems = commonSection ? parseBulletItems(commonSection) : []
    const combined = [...packageItems, ...commonItems]
    if (combined.length > 0) {
      return formatItemsList(combined)
    }
  }

  const definition = getCdlPackageDefinition(pkg.package_key)
  if (definition) {
    return formatItemsList([...definition.items, ...PACKAGE_COMMON_ITEMS])
  }

  return null
}

function garnishItemsFromDescription(
  pkg: QuoteReviewPackageFields,
  language: QuoteLanguage,
): string[] {
  const description = getDescriptionText(pkg, language)
  if (!description) return []

  const garnishHeaderMatch = description.match(
    /Guarnições inclusas(?:\s*\([^)]+\))?:/i,
  )
  const garnishSection = garnishHeaderMatch
    ? extractDescriptionSection(description, garnishHeaderMatch[0]) ??
      description.slice(description.indexOf(garnishHeaderMatch[0]) + garnishHeaderMatch[0].length)
    : extractDescriptionSection(description, 'Guarnições:')

  return garnishSection ? parseBulletItems(garnishSection) : []
}

export function garnishDescription(
  pkg: QuoteReviewPackageFields | null,
  language: QuoteLanguage = 'pt',
): string | null {
  if (!pkg) return null

  const fromDescription = garnishItemsFromDescription(pkg, language)
  if (fromDescription.length > 0) {
    return formatItemsList(fromDescription)
  }

  const definition = getCdlPackageDefinition(pkg.package_key)
  if (definition?.with_sides) {
    return formatItemsList(SIDES_ITEMS)
  }

  const variant = getPackageCatalogVariant(pkg)
  if (variant === 'with_sides') {
    const sidesText = getPackageSidesDescription(language)
    const prefix = language === 'en' ? 'Sides: ' : language === 'es' ? 'Guarniciones: ' : 'Guarnições: '
    if (sidesText.startsWith(prefix)) {
      return sidesText.slice(prefix.length).trim()
    }
    return sidesText
  }

  return null
}

export function totalUnitPrice(pkg: QuoteReviewPackageFields | null): number {
  if (!pkg) return 0
  return getPackageCatalogPrice(pkg)
}

export function packageUnitPrice(
  pkg: QuoteReviewPackageFields | null,
  allPackages: ReadonlyArray<PackageCatalogFields> = [],
  sidesPricePerPerson = 0,
): number {
  if (!pkg) return 0

  const registered = getPackageCatalogPrice(pkg)
  const basePackage = findBasePackage(pkg, allPackages)
  const sidesPricing =
    getPackageCatalogVariant(pkg) === 'with_sides'
      ? resolvePackageSidesPricing(pkg, basePackage, sidesPricePerPerson)
      : null

  if (sidesPricing?.basePricePerPerson != null) {
    if (sidesPricing.mode === 'breakdown') {
      return sidesPricing.basePricePerPerson
    }
    return sidesPricing.basePricePerPerson
  }

  if ((pkg.package_key ?? '').trim().endsWith('+') && sidesPricePerPerson > 0) {
    return Math.max(0, registered - sidesPricePerPerson)
  }

  return registered
}

export function garnishUnitPrice(
  pkg: QuoteReviewPackageFields | null,
  allPackages: ReadonlyArray<PackageCatalogFields> = [],
  sidesPricePerPerson = 0,
): number {
  if (!pkg) return 0

  const registered = getPackageCatalogPrice(pkg)
  const base = packageUnitPrice(pkg, allPackages, sidesPricePerPerson)
  const basePackage = findBasePackage(pkg, allPackages)
  const sidesPricing =
    getPackageCatalogVariant(pkg) === 'with_sides'
      ? resolvePackageSidesPricing(pkg, basePackage, sidesPricePerPerson)
      : null

  if (sidesPricing?.mode === 'breakdown') {
    return sidesPricing.sidesPricePerPerson
  }

  return Math.max(0, roundMoney(registered - base))
}

export function chargedPeople(count: number | null | undefined): number {
  return Math.max(0, Number(count ?? 0))
}

export function packageTotalPrice(
  unitPrice: number,
  people: number,
): number {
  return roundMoney(unitPrice * chargedPeople(people))
}

export function garnishTotalPrice(
  unitPrice: number,
  people: number,
): number {
  return roundMoney(unitPrice * chargedPeople(people))
}

export function grandTotalPrice(
  unitPrice: number,
  people: number,
): number {
  return roundMoney(unitPrice * chargedPeople(people))
}

export function hasGarnish(input: {
  pkg: QuoteReviewPackageFields | null
  fromWithSidesSection?: boolean
  garnishUnitPrice: number
  garnishDescription: string | null
}): boolean {
  const packageKey = (input.pkg?.package_key ?? '').trim()
  return (
    Boolean(input.fromWithSidesSection) ||
    packageKey.endsWith('+') ||
    input.garnishUnitPrice > 0 ||
    Boolean(input.garnishDescription?.trim())
  )
}

export function buildQuoteReviewPackageSummary(
  input: QuoteReviewPackageSummaryInput,
): QuoteReviewPackageSummary | null {
  if (!input.pkg) return null

  const language = input.language ?? 'pt'
  const people = chargedPeople(input.chargedPeople)
  const garnishItems = garnishDescription(input.pkg, language)
  const garnishPerPerson = garnishUnitPrice(
    input.pkg,
    input.allPackages ?? [],
    input.sidesPricePerPerson,
  )
  const garnish = hasGarnish({
    pkg: input.pkg,
    fromWithSidesSection: input.fromWithSidesSection,
    garnishUnitPrice: garnishPerPerson,
    garnishDescription: garnishItems,
  })
  const basePerPerson = packageUnitPrice(
    input.pkg,
    input.allPackages ?? [],
    input.sidesPricePerPerson,
  )
  const totalPerPerson = totalUnitPrice(input.pkg)

  return {
    hasGarnish: garnish,
    packageItemsDescription: packageItemsDescription(input.pkg, language),
    garnishDescription: garnish ? (garnishItems ?? '—') : 'Não',
    packageUnitPrice: basePerPerson,
    garnishUnitPrice: garnish ? garnishPerPerson : 0,
    totalUnitPrice: totalPerPerson,
    chargedPeople: people,
    packageTotalPrice: packageTotalPrice(basePerPerson, people),
    garnishTotalPrice: garnishTotalPrice(garnish ? garnishPerPerson : 0, people),
    grandTotalPrice: grandTotalPrice(totalPerPerson, people),
  }
}
