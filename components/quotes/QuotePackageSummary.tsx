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
  getPackageItemsDisplayText,
} from '@/Lib/packageDisplay'
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
}: {
  pkg: PackageCatalogFields & { id?: string }
  allPackages?: ReadonlyArray<PackageCatalogFields>
  language?: QuoteLanguage
  sidesPricePerPerson?: number
  selected?: boolean
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

  const rawItems = getPackageItemsDisplayText(pkg, 'pt')
  const itemsText = rawItems
    ? formatPackageBulletText(rawItems)
    : 'Descrição não cadastrada'

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
          label: 'Guarnições',
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
            label: 'Guarnições',
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
              label: 'Guarnições',
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
      <div className="bg-neutral-50 p-3 sm:p-4">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl sm:aspect-[16/10] lg:aspect-[5/4]">
          <CatalogImageFrame
            src={image}
            alt={detailTitle}
            variant="package"
            fallbackLabel="Imagem do pacote não cadastrada"
            rounded="lg"
            className="!h-full !min-h-0 !max-h-none !w-full"
          />
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
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
