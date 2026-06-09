import {
  garnishDescription,
  packageItemsDescription,
} from '@/components/quote-review/quoteReviewPackageSummary'
import type { PackageFieldSource } from '@/Lib/packageFieldAccess'
import {
  getPackageHasGarnish,
  getPackageKey,
} from '@/Lib/packageFieldAccess'

const DEFAULT_GARNISH_TEXT_PT =
  'Arroz branco, Feijão tropeiro, Vinagrete, Farofa e Mandioca.'

const PACKAGE_TIER_ORDER = ['PRI', 'CHO', 'SEL', 'TRAD', 'PERS'] as const

const PACKAGE_TIER_NAMES: Record<
  (typeof PACKAGE_TIER_ORDER)[number],
  string
> = {
  PRI: 'Prime',
  CHO: 'Choice',
  SEL: 'Select',
  TRAD: 'Traditional',
  PERS: 'Personalized',
}

function detectPackageTier(
  packageKey: string,
): (typeof PACKAGE_TIER_ORDER)[number] | null {
  const key = packageKey.toUpperCase().replace(/\+$/, '')
  for (const tier of PACKAGE_TIER_ORDER) {
    if (key.includes(tier)) return tier
  }
  return null
}

export function getPackageTierSortIndex(
  pkg: PackageFieldSource | null | undefined,
): number {
  const tier = detectPackageTier(getPackageKey(pkg))
  if (!tier) return PACKAGE_TIER_ORDER.length
  return PACKAGE_TIER_ORDER.indexOf(tier)
}

/** Prime → Choice → Select → Traditional → Personalized */
export function sortPackagesByCommercialTier<
  T extends PackageFieldSource,
>(packages: ReadonlyArray<T>): T[] {
  return [...packages].sort((a, b) => {
    const rankDiff = getPackageTierSortIndex(a) - getPackageTierSortIndex(b)
    if (rankDiff !== 0) return rankDiff
    return getPackageKey(a).localeCompare(getPackageKey(b))
  })
}

export function getPackageItemsDisplayText(
  pkg: PackageFieldSource | null | undefined,
  language: 'pt' | 'en' | 'es' = 'pt',
): string {
  const parsed = packageItemsDescription(pkg ?? null, language)
  if (parsed?.trim()) return parsed
  return ''
}

export function getPackageGarnishDisplayText(
  pkg: PackageFieldSource | null | undefined,
  language: 'pt' | 'en' | 'es' = 'pt',
): string {
  if (!getPackageHasGarnish(pkg)) {
    return language === 'en'
      ? 'Not included'
      : language === 'es'
        ? 'No incluidas'
        : 'Não inclusas'
  }

  const parsed = garnishDescription(pkg ?? null, language)
  if (parsed?.trim()) return parsed

  if (language === 'pt') return DEFAULT_GARNISH_TEXT_PT
  return parsed ?? DEFAULT_GARNISH_TEXT_PT
}

export function getPackageGroupSummaryCodes(
  packages: ReadonlyArray<{ package_key?: string | null }>,
): string {
  return sortPackagesByCommercialTier(packages)
    .map((pkg) => getPackageKey(pkg))
    .filter(Boolean)
    .join(' · ')
}

/** Converte texto com vírgulas ou quebras em lista com bullet • */
export function formatPackageBulletText(text: string | null | undefined): string {
  const raw = String(text ?? '').trim()
  if (!raw) return ''

  if (raw.includes('•')) return raw

  return raw
    .split(/\s*[,;]\s*|\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' • ')
}

/** Nome comercial genérico (label_en ou fallback). */
export function getPackageCommercialName(
  pkg: PackageFieldSource | null | undefined,
): string {
  if (!pkg) return '—'
  const tier = detectPackageTier(getPackageKey(pkg))
  if (tier) return PACKAGE_TIER_NAMES[tier]
  return (
    pkg.label_en?.trim() ||
    pkg.package_name?.trim() ||
    pkg.label_pt?.trim() ||
    getPackageKey(pkg) ||
    '—'
  )
}

/** Segunda cascata: BBQ Prime, BBQ Choice, BBQ Personalizado, etc. */
export function getPackageCascadeFriendlyLabel(
  pkg: PackageFieldSource | null | undefined,
): string {
  const tier = detectPackageTier(getPackageKey(pkg))
  if (!tier) return getPackageCommercialName(pkg)
  if (tier === 'PERS') return 'BBQ Personalizado'
  return `BBQ ${PACKAGE_TIER_NAMES[tier]}`
}

/** Card de detalhe na cotação: BBQ Choice com guarnições, etc. */
export function getPackageDetailTitle(
  pkg: PackageFieldSource | null | undefined,
): string {
  const friendly = getPackageCascadeFriendlyLabel(pkg)
  if (getPackageHasGarnish(pkg)) {
    return `${friendly} com guarnições`
  }
  return friendly
}
