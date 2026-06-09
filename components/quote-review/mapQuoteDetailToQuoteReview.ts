import type { QuoteDetail } from '@/app/quotes/[id]/quoteDetailTypes'
import { SIDES_PRICE_PER_PERSON } from '@/Lib/cdlCommercialRules'
import { resolvePackageCatalogImageUrl } from '@/Lib/packageCatalogVisual'
import type { QuoteSavedSnapshot } from '@/Lib/readQuoteSnapshot'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'
import {
  buildQuoteReviewPackageSummary,
  type QuoteReviewPackageFields,
  type QuoteReviewPackageSummary,
} from './quoteReviewPackageSummary'

function quoteLanguage(quote: QuoteDetail): QuoteLanguage {
  const lang = quote.language ?? 'pt'
  if (lang === 'en' || lang === 'es') return lang
  return 'pt'
}

function packageNameIndicatesGarnish(name: string | null | undefined): boolean {
  const normalized = (name ?? '').toLowerCase()
  return (
    normalized.includes('guarni') ||
    normalized.includes('guarnicion') ||
    normalized.includes('side dish')
  )
}

export function quoteDetailToPackageFields(
  quote: QuoteDetail,
): QuoteReviewPackageFields | null {
  const packageKey = quote.package_key?.trim()
  if (!packageKey && !quote.package_name_pt) return null

  return {
    package_key: packageKey,
    package_name: quote.package_name_pt,
    label_pt: quote.package_name_pt,
    label_en: quote.package_name_en,
    label_es: quote.package_name_es,
    description_pt:
      quote.package_description_pt ??
      quote.package_description ??
      undefined,
    description_en: quote.package_description_en ?? undefined,
    description_es: quote.package_description_es ?? undefined,
    description: quote.package_description ?? undefined,
    price_per_person:
      quote.package_price_per_person ?? quote.package_unit_price ?? undefined,
    price: quote.package_price_per_person ?? quote.package_unit_price ?? undefined,
    image_url: quote.package_image_url ?? undefined,
  }
}

export function resolveQuoteDetailPackageImageUrl(quote: QuoteDetail): string | null {
  const pkg = quoteDetailToPackageFields(quote)
  return (
    resolvePackageCatalogImageUrl(pkg, pkg ? [pkg] : [], quote.package_id) ||
    quote.package_image_url?.trim() ||
    null
  )
}

export function buildQuoteReviewPackageSummaryFromQuote(
  quote: QuoteDetail,
  snapshot: Pick<QuoteSavedSnapshot, 'billableGuestCount'>,
): QuoteReviewPackageSummary | null {
  const pkg = quoteDetailToPackageFields(quote)
  if (!pkg) return null

  const packageName =
    quote.package_name_pt ??
    quote.package_name_en ??
    quote.package_name_es ??
    null

  return buildQuoteReviewPackageSummary({
    pkg,
    sidesPricePerPerson: SIDES_PRICE_PER_PERSON,
    chargedPeople: snapshot.billableGuestCount ?? 0,
    fromWithSidesSection:
      (quote.package_key ?? '').trim().endsWith('+') ||
      packageNameIndicatesGarnish(packageName),
    language: quoteLanguage(quote),
  })
}
