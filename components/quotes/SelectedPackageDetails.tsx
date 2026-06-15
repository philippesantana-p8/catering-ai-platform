'use client'

import CatalogImageFrame from '@/components/CatalogImageFrame'
import PackageIncludedOptions from '@/components/quotes/PackageIncludedOptions'
import PackageIncludedSidesSummary from '@/components/quotes/PackageIncludedSidesSummary'
import {
  findBasePackage,
  formatPackageCatalogPriceLabel,
  getPackageCatalogImage,
  getPackageCatalogPrice,
  getPackageCatalogVariant,
  isPackageCatalogPriceOnRequest,
  resolvePackageSidesPricing,
  type PackageCatalogFields,
} from '@/Lib/packageCatalogVisual'
import { parsePackageHighlightsText } from '@/Lib/packageDisplay'
import { hasPackageIncludedChoices, type PackageOptionGroup } from '@/Lib/packageOptionGroups'
import type { PackageSideItem } from '@/Lib/packageConfiguration'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function filterHighlightBullets(items: string[]): string[] {
  return items
    .filter((item) => {
      const normalized = item.toLowerCase()
      return !normalized.includes('selecionad')
    })
    .slice(0, 3)
}

type PackageWithHighlights = PackageCatalogFields & {
  id?: string
  package_highlights_pt?: string | null
}

export default function SelectedPackageDetails({
  pkg,
  allPackages = [],
  language = 'pt',
  sidesPricePerPerson = 13,
  optionGroups = [],
  packageSideItems = [],
  selections = {},
  onSelectionChange,
  pendingSelectionGroupIds = [],
}: {
  pkg: PackageWithHighlights
  allPackages?: ReadonlyArray<PackageCatalogFields>
  language?: QuoteLanguage
  sidesPricePerPerson?: number
  optionGroups?: ReadonlyArray<PackageOptionGroup>
  packageSideItems?: ReadonlyArray<PackageSideItem>
  selections?: Record<string, string>
  onSelectionChange?: (groupId: string, itemId: string) => void
  pendingSelectionGroupIds?: string[]
}) {
  const image = getPackageCatalogImage(pkg, allPackages)
  const variant = getPackageCatalogVariant(pkg)
  const priceOnRequest = isPackageCatalogPriceOnRequest(pkg)
  const basePackage = findBasePackage(pkg, allPackages)
  const sidesPricing =
    variant === 'with_sides'
      ? resolvePackageSidesPricing(pkg, basePackage, sidesPricePerPerson)
      : null
  const packagePrice = getPackageCatalogPrice(pkg)
  const totalPerPerson = sidesPricing?.totalPerPerson ?? packagePrice
  const hasOptions =
    pkg.id && hasPackageIncludedChoices(pkg.id, optionGroups, pkg)

  const highlightItems = filterHighlightBullets(
    parsePackageHighlightsText(pkg.package_highlights_pt),
  )

  return (
    <div className="mt-2 space-y-2.5 border-t border-cdl-border-subtle pt-2.5">
      <p className="text-xl font-black text-red-600 sm:text-2xl">
        {priceOnRequest
          ? formatPackageCatalogPriceLabel(pkg, language, formatCurrency)
          : formatCurrency(totalPerPerson)}
        {!priceOnRequest ? (
          <span className="ml-1 text-sm font-semibold text-neutral-500">
            / pessoa
          </span>
        ) : null}
      </p>

      {highlightItems.length > 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 px-3 py-2.5 ring-1 ring-amber-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900">
            Destaques do pacote
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {highlightItems.map((item) => (
              <li
                key={item}
                className="text-xs leading-snug text-amber-950 before:mr-1.5 before:font-bold before:content-['•'] sm:text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-neutral-50">
        <div className="aspect-[16/10] w-full max-h-44 overflow-hidden sm:max-h-52">
          <CatalogImageFrame
            src={image}
            alt={pkg.label_pt?.trim() || pkg.package_key || 'Pacote'}
            variant="package"
            fallbackLabel="Imagem do pacote"
            rounded="all"
            className="!h-full !min-h-0 !max-h-none !w-full object-contain"
          />
        </div>
      </div>

      {hasOptions && onSelectionChange ? (
        <PackageIncludedOptions
          optionGroups={optionGroups}
          selections={selections}
          onChange={onSelectionChange}
          language={language}
          mode="select"
          pendingGroupIds={pendingSelectionGroupIds}
        />
      ) : null}

      {variant === 'with_sides' && pkg.id ? (
        <PackageIncludedSidesSummary
          packageId={pkg.id}
          packageSideItems={packageSideItems}
          language={language}
        />
      ) : null}
    </div>
  )
}
