import { calcMarginPercent } from '@/Lib/backofficeFinance'
import {
  getPackageHasGarnish,
  type PackageFieldSource,
} from '@/Lib/packageFieldAccess'
import type { PackagesInsertPayload } from '@/Lib/packagesTableSchema'

export type PackageCatalogRow = {
  package_key?: string | null
  price_per_person?: number | null
}

export function packageKeyHasGarnish(packageKey: string | null | undefined): boolean {
  return getPackageHasGarnish({ package_key: packageKey })
}

export function getBasePackageCode(packageKey: string | null | undefined): string | null {
  const key = (packageKey ?? '').trim()
  if (!key.endsWith('+')) return null
  return key.replace(/\+$/, '') || null
}

export function inferPackageType(
  packageKey: string | null | undefined,
  explicit?: string | null,
): 'base' | 'with_garnish' | 'custom' {
  if (explicit === 'with_garnish' || explicit === 'base' || explicit === 'custom') {
    return explicit
  }
  const key = (packageKey ?? '').trim().toUpperCase()
  if (key.includes('PERS')) return 'custom'
  if (key.endsWith('+')) return 'with_garnish'
  return 'base'
}

export function normalizePackageDraft(
  draft: Record<string, unknown>,
  allPackages: ReadonlyArray<PackageCatalogRow> = [],
): Record<string, unknown> {
  const packageKey = String(draft.package_key ?? '').trim()
  const packageType = inferPackageType(packageKey, draft.package_type as string | null)
  const hasGarnish =
    packageType === 'with_garnish' ||
    draft.has_garnish === true ||
    getPackageHasGarnish({ ...(draft as PackageFieldSource), package_key: packageKey })
  const basePackageCode =
    String(draft.base_package_code ?? '').trim() ||
    getBasePackageCode(packageKey) ||
    null

  let garnishPricePerPerson = Number(draft.garnish_price_per_person ?? 0)
  if (hasGarnish && garnishPricePerPerson <= 0 && basePackageCode) {
    const base = allPackages.find(
      (row) => (row.package_key ?? '').trim() === basePackageCode,
    )
    const registered = Number(draft.price_per_person ?? 0)
    const basePrice = Number(base?.price_per_person ?? 0)
    if (registered > 0 && basePrice > 0 && registered >= basePrice) {
      garnishPricePerPerson = Math.round((registered - basePrice) * 100) / 100
    }
  }

  const pricePerPerson = Number(draft.price_per_person ?? 0)
  const costPerPerson = Number(draft.cost_per_person ?? 0)

  return {
    ...draft,
    package_key: packageKey,
    package_type: packageType,
    has_garnish: hasGarnish,
    base_package_code: hasGarnish ? basePackageCode : null,
    garnish_price_per_person: hasGarnish ? garnishPricePerPerson : 0,
    margin_percent: calcMarginPercent(pricePerPerson, costPerPerson),
  }
}

export function splitPackagesByGarnish<
  T extends { package_key?: string | null },
>(packages: T[]) {
  const withoutGarnish: T[] = []
  const withGarnish: T[] = []

  for (const pkg of packages) {
    const key = (pkg.package_key ?? '').trim()
    if (key.endsWith('+')) {
      withGarnish.push(pkg)
    } else if (!key.toUpperCase().includes('PERS')) {
      withoutGarnish.push(pkg)
    } else {
      withoutGarnish.push(pkg)
    }
  }

  return { withoutGarnish, withGarnish }
}
