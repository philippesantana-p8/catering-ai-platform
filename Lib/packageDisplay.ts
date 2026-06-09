import {
  garnishDescription,
  packageItemsDescription,
} from '@/components/quote-review/quoteReviewPackageSummary'
import type { PackageFieldSource } from '@/Lib/packageFieldAccess'
import { getPackageHasGarnish, getPackageKey } from '@/Lib/packageFieldAccess'

const DEFAULT_GARNISH_TEXT_PT =
  'Arroz branco, Feijão tropeiro, Vinagrete, Farofa e Mandioca.'

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
  return packages
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

export function getPackageCommercialName(
  pkg: PackageFieldSource | null | undefined,
): string {
  if (!pkg) return '—'
  return (
    pkg.label_en?.trim() ||
    pkg.package_name?.trim() ||
    pkg.label_pt?.trim() ||
    getPackageKey(pkg) ||
    '—'
  )
}
