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
import { getPackageDetailTitle, parsePackageHighlightsText } from '@/Lib/packageDisplay'
import { hasPackageIncludedChoices, type PackageOptionGroup } from '@/Lib/packageOptionGroups'
import type { PackageItem, PackageSideItem } from '@/Lib/packageConfiguration'
import type { CatalogItemListItem } from '@/Lib/itemCatalog'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
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
  catalogItems = [],
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
  packageItems?: ReadonlyArray<PackageItem>
  catalogItems?: ReadonlyArray<CatalogItemListItem>
  selections?: Record<string, string>
  onSelectionChange?: (groupId: string, itemId: string) => void
  pendingSelectionGroupIds?: string[]
}) {
  const image = getPackageCatalogImage(pkg, allPackages)
  const variant = getPackageCatalogVariant(pkg)
  const detailTitle = getPackageDetailTitle(pkg)
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

  const highlightItems = parsePackageHighlightsText(pkg.package_highlights_pt).slice(
    0,
    4,
  )

  return (
    <div className="mt-3 space-y-3 border-t border-cdl-border-subtle pt-3">
      <div className="overflow-hidden rounded-xl bg-neutral-50 p-2">
        <div className="aspect-[16/10] w-full max-h-52 overflow-hidden rounded-lg sm:max-h-60">
          <CatalogImageFrame
            src={image}
            alt={detailTitle}
            variant="package"
            fallbackLabel="Imagem do pacote"
            rounded="all"
            className="!h-full !min-h-0 !max-h-none !w-full"
          />
        </div>
      </div>

      <p className="text-2xl font-black text-red-600">
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
        <div className="rounded-xl bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 p-3 ring-1 ring-amber-200/80">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
            Destaques
          </p>
          <ul className="mt-2 space-y-1">
            {highlightItems.map((item) => (
              <li
                key={item}
                className="text-sm text-amber-950 before:mr-2 before:font-bold before:content-['•']"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasOptions && onSelectionChange ? (
        <PackageIncludedOptions
          optionGroups={optionGroups}
          selections={selections}
          onChange={onSelectionChange}
          language={language}
          mode="select"
          catalogItems={catalogItems}
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
