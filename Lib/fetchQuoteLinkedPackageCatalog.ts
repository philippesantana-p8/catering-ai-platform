import { buildPackagesListSelect } from '@/Lib/packagesTableSchema'
import {
  getBasePackageKey,
  resolvePackageCatalogImageUrl,
  type PackageCatalogRecord,
} from '@/Lib/packageCatalogVisual'
import { supabase } from '@/Lib/supabase'

type PackageRow = PackageCatalogRecord & {
  id: string
  description_pt?: string | null
  description_en?: string | null
  description_es?: string | null
}

export type QuoteLinkedPackageCatalog = {
  linkedPackage: PackageRow | null
  catalogPackages: PackageRow[]
  resolvedImageUrl: string | null
}

const EMPTY_CATALOG: QuoteLinkedPackageCatalog = {
  linkedPackage: null,
  catalogPackages: [],
  resolvedImageUrl: null,
}

async function fetchPackageById(packageId: string): Promise<PackageRow | null> {
  const { data, error } = await supabase
    .from('packages')
    .select(buildPackagesListSelect())
    .eq('id', packageId)
    .maybeSingle()

  if (error) {
    console.error(
      `[CDL Quote] Failed to load package ${packageId}:`,
      error.message,
    )
    return null
  }

  return (data as PackageRow | null) ?? null
}

async function fetchPackageByKey(packageKey: string): Promise<PackageRow | null> {
  const { data, error } = await supabase
    .from('packages')
    .select(buildPackagesListSelect())
    .eq('package_key', packageKey)
    .maybeSingle()

  if (error) {
    console.error(
      `[CDL Quote] Failed to load package key ${packageKey}:`,
      error.message,
    )
    return null
  }

  return (data as PackageRow | null) ?? null
}

async function fetchBasePackageForKey(
  packageKey: string,
): Promise<PackageRow | null> {
  const baseKey = getBasePackageKey(packageKey)
  if (!baseKey || baseKey === packageKey) return null
  return fetchPackageByKey(baseKey)
}

export async function fetchQuoteLinkedPackageCatalog(input: {
  packageId?: string | null
  packageKey?: string | null
}): Promise<QuoteLinkedPackageCatalog> {
  const packageId = input.packageId?.trim()
  const packageKey = input.packageKey?.trim()

  let linkedPackage: PackageRow | null = null

  if (packageId) {
    linkedPackage = await fetchPackageById(packageId)
  }

  if (!linkedPackage && packageKey) {
    linkedPackage = await fetchPackageByKey(packageKey)
  }

  if (!linkedPackage) {
    return EMPTY_CATALOG
  }

  const catalogPackages: PackageRow[] = [linkedPackage]
  const linkedKey = (linkedPackage.package_key ?? packageKey ?? '').trim()

  if (linkedKey.endsWith('+')) {
    const basePackage = await fetchBasePackageForKey(linkedKey)
    if (basePackage && !catalogPackages.some((pkg) => pkg.id === basePackage.id)) {
      catalogPackages.push(basePackage)
    }
  }

  const resolvedImageUrl = resolvePackageCatalogImageUrl(
    linkedPackage,
    catalogPackages,
    linkedPackage.id,
  )

  return {
    linkedPackage,
    catalogPackages,
    resolvedImageUrl,
  }
}
