'use client'

import CatalogImageFrame from '@/components/CatalogImageFrame'
import { PriceBreakdownCard, PremiumCard, StatusBadge } from '@/components/premium/PremiumPrimitives'
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
import {
  formatPackageBulletText,
  getPackageDetailTitle,
  getPackageGarnishDisplayText,
  getPackageHighlights,
  getPackageItemsDescription,
} from '@/Lib/packageDisplay'
import {
  getOptionGroupTitle,
  getOptionItemLabel,
  isCustomPackage,
  resolvePackageItemsWithSelections,
  type PackageOptionGroup,
} from '@/Lib/packageOptionGroups'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

export default function QuotePackageSummary({
  pkg,
  allPackages = [],
  language = 'pt',
  sidesPricePerPerson = 13,
  selected = false,
  compact = false,
  optionGroups = [],
  selections = {},
  onSelectionChange,
}: {
  pkg: PackageCatalogFields & { id?: string }
  allPackages?: ReadonlyArray<PackageCatalogFields>
  language?: QuoteLanguage
  sidesPricePerPerson?: number
  selected?: boolean
  compact?: boolean
  optionGroups?: ReadonlyArray<PackageOptionGroup>
  selections?: Record<string, string>
  onSelectionChange?: (groupId: string, itemId: string) => void
}) {
  const image = getPackageCatalogImage(pkg, allPackages)
  const variant = getPackageCatalogVariant(pkg)
  const detailTitle = getPackageDetailTitle(pkg)
  const priceOnRequest = isPackageCatalogPriceOnRequest(pkg)
  const perPerson = 'pessoa'
  const basePackage = findBasePackage(pkg, allPackages)
  const sidesPricing =
    variant === 'with_sides'
      ? resolvePackageSidesPricing(pkg, basePackage, sidesPricePerPerson)
      : null

  const showOptionGroups =
    optionGroups.length > 0 && !isCustomPackage(pkg) && Boolean(onSelectionChange)

  const rawItems = getPackageItemsDescription(pkg, 'pt')
  const itemsText = rawItems
    ? formatPackageBulletText(
        showOptionGroups
          ? resolvePackageItemsWithSelections(
              rawItems,
              selections,
              optionGroups,
              language,
            )
          : rawItems,
      )
    : 'Descrição não cadastrada'

  const highlightItems = getPackageHighlights(pkg, 'pt')
    .split(' • ')
    .map((item) => item.trim())
    .filter(Boolean)

  const garnishText =
    variant === 'with_sides'
      ? formatPackageBulletText(getPackageGarnishDisplayText(pkg, 'pt'))
      : 'Não inclusas'

  const packagePrice = getPackageCatalogPrice(pkg)

  const breakdownRows = priceOnRequest
    ? [
        {
          label: 'Valor do pacote',
          value: formatPackageCatalogPriceLabel(pkg, language, formatCurrency),
          emphasis: true,
        },
        {
          label: 'Valor das guarnições',
          value: 'Não inclusas',
        },
      ]
    : variant === 'without_sides'
      ? [
          {
            label: 'Valor do pacote',
            value: `${formatCurrency(packagePrice)} / ${perPerson}`,
          },
          {
            label: 'Valor das guarnições',
            value: 'Não inclusas',
          },
          {
            label: 'Total',
            value: `${formatCurrency(packagePrice)} / ${perPerson}`,
            emphasis: true,
          },
        ]
      : sidesPricing?.mode === 'breakdown' &&
          sidesPricing.basePricePerPerson != null
        ? [
            {
              label: 'Valor do pacote',
              value: `${formatCurrency(sidesPricing.basePricePerPerson)} / ${perPerson}`,
            },
            {
              label: 'Valor das guarnições',
              value: `+ ${formatCurrency(sidesPricing.sidesPricePerPerson)} / ${perPerson}`,
            },
            {
              label: 'Total',
              value: `${formatCurrency(sidesPricing.totalPerPerson)} / ${perPerson}`,
              emphasis: true,
            },
          ]
        : [
            {
              label: 'Total',
              value: `${formatCurrency(sidesPricing?.totalPerPerson ?? packagePrice)} / ${perPerson}`,
              emphasis: true,
            },
          ]

  return (
    <PremiumCard
      className={
        selected
          ? 'overflow-hidden ring-2 ring-emerald-400 ring-offset-2'
          : 'overflow-hidden'
      }
    >
      <div className={compact ? 'bg-neutral-50 p-2.5' : 'bg-neutral-50 p-3 sm:p-4'}>
        <div
          className={`w-full overflow-hidden rounded-xl ${
            compact
              ? 'aspect-[3/2] max-h-52'
              : 'aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/4]'
          }`}
        >
          <CatalogImageFrame
            src={image}
            alt={detailTitle}
            variant="package"
            fallbackLabel="Imagem do pacote não cadastrada"
            rounded="all"
            className="!h-full !min-h-0 !max-h-none !w-full !rounded-xl"
          />
        </div>
      </div>

      <div className={compact ? 'space-y-3 p-4' : 'space-y-4 p-5 sm:p-6'}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            {pkg.package_key}
          </span>
          {variant === 'with_sides' ? (
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200">
              + guarnições
            </span>
          ) : null}
          {selected ? <StatusBadge active label="Selecionado" /> : null}
        </div>

        <h3 className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">
          {detailTitle}
        </h3>

        {highlightItems.length > 0 ? (
          <div className="package-highlights-box">
            <p className="package-highlights-title">Diferenciais do pacote</p>
            <div className="package-highlights-list">
              {highlightItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}

        {showOptionGroups ? (
          <div className="space-y-4 rounded-xl border border-red-100 bg-gradient-to-br from-red-50/80 to-amber-50/40 p-4">
            <p className="text-sm font-bold text-neutral-900">
              Escolhas inclusas no pacote
            </p>
            {optionGroups.map((group) => {
              const groupTitle = getOptionGroupTitle(group, language)
              const selectedItemId = selections[group.id] ?? null
              return (
                <div key={group.id} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">
                    {groupTitle}
                    {group.required ? (
                      <span className="ml-1 text-red-600">*</span>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const active = selectedItemId === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectionChange?.(group.id, item.id)}
                          className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                            active
                              ? 'border-red-400 bg-gradient-to-br from-red-50 to-amber-50 text-red-900 shadow-sm ring-2 ring-amber-300'
                              : 'border-neutral-200 bg-white text-neutral-800 hover:border-red-200 hover:bg-red-50/40'
                          }`}
                        >
                          {getOptionItemLabel(item, language)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        <div>
          <p className="text-sm leading-relaxed text-neutral-700">
            <span className="font-bold text-neutral-900">Itens do pacote:</span>
            <br />
            {itemsText}
          </p>
        </div>

        {variant === 'with_sides' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-sm font-bold text-amber-950">Guarnições:</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
              {garnishText}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-neutral-700">
            <span className="font-bold text-neutral-900">Guarnições:</span>{' '}
            {garnishText}
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-bold text-neutral-900">Valores:</p>
          <PriceBreakdownCard rows={breakdownRows} />
        </div>
      </div>
    </PremiumCard>
  )
}
