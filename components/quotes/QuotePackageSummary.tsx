'use client'

import CatalogImageFrame from '@/components/CatalogImageFrame'
import { PriceBreakdownCard, PremiumCard, StatusBadge } from '@/components/premium/PremiumPrimitives'
import {
  findBasePackage,
  formatPackageCatalogPriceLabel,
  getPackageCatalogImage,
  getPackageCatalogPrice,
  getPackageCatalogVariant,
  getPackagePriceLineLabel,
  isPackageCatalogPriceOnRequest,
  resolvePackageSidesPricing,
  type PackageCatalogFields,
} from '@/Lib/packageCatalogVisual'
import {
  formatPackageBulletText,
  getPackageCommercialName,
  getPackageGarnishDisplayText,
  getPackageItemsDisplayText,
} from '@/Lib/packageDisplay'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function perPersonSuffix(language: QuoteLanguage): string {
  if (language === 'en') return 'person'
  if (language === 'es') return 'persona'
  return 'pessoa'
}

function itemsNotRegisteredLabel(language: QuoteLanguage): string {
  if (language === 'en') return 'Description not registered'
  if (language === 'es') return 'Descripción no registrada'
  return 'Descrição não cadastrada'
}

export default function QuotePackageSummary({
  pkg,
  allPackages = [],
  language = 'pt',
  sidesPricePerPerson = 13,
  selected = false,
  layout = 'stacked',
}: {
  pkg: PackageCatalogFields & { id?: string }
  allPackages?: ReadonlyArray<PackageCatalogFields>
  language?: QuoteLanguage
  sidesPricePerPerson?: number
  selected?: boolean
  layout?: 'stacked' | 'split'
}) {
  const image = getPackageCatalogImage(pkg, allPackages)
  const variant = getPackageCatalogVariant(pkg)
  const commercialName = getPackageCommercialName(pkg)
  const priceOnRequest = isPackageCatalogPriceOnRequest(pkg)
  const perPerson = perPersonSuffix(language)
  const basePackage = findBasePackage(pkg, allPackages)
  const sidesPricing =
    variant === 'with_sides'
      ? resolvePackageSidesPricing(pkg, basePackage, sidesPricePerPerson)
      : null

  const rawItems = getPackageItemsDisplayText(pkg, language)
  const itemsText = rawItems
    ? formatPackageBulletText(rawItems)
    : itemsNotRegisteredLabel(language)

  const garnishText =
    variant === 'with_sides'
      ? formatPackageBulletText(getPackageGarnishDisplayText(pkg, language))
      : language === 'en'
        ? 'Not included'
        : language === 'es'
          ? 'No incluidas'
          : 'Não inclusas'

  const sidesNotIncludedLabel =
    language === 'en'
      ? 'Not included'
      : language === 'es'
        ? 'No incluidas'
        : 'Não inclusas'

  const basePackageLabel =
    language === 'en'
      ? 'Base package'
      : language === 'es'
        ? 'Paquete base'
        : 'Pacote base'

  const packagePrice = getPackageCatalogPrice(pkg)

  const breakdownRows = priceOnRequest
    ? [
        {
          label: getPackagePriceLineLabel('package', language),
          value: formatPackageCatalogPriceLabel(pkg, language, formatCurrency),
          emphasis: true,
        },
        {
          label: getPackagePriceLineLabel('sides', language),
          value: sidesNotIncludedLabel,
        },
      ]
    : variant === 'without_sides'
      ? [
          {
            label: basePackageLabel,
            value: `${formatCurrency(packagePrice)} / ${perPerson}`,
          },
          {
            label: getPackagePriceLineLabel('sides', language),
            value: sidesNotIncludedLabel,
          },
          {
            label: getPackagePriceLineLabel('total', language),
            value: `${formatCurrency(packagePrice)} / ${perPerson}`,
            emphasis: true,
          },
        ]
      : sidesPricing?.mode === 'breakdown' &&
          sidesPricing.basePricePerPerson != null
        ? [
            {
              label: basePackageLabel,
              value: `${formatCurrency(sidesPricing.basePricePerPerson)} / ${perPerson}`,
            },
            {
              label: getPackagePriceLineLabel('sides', language),
              value: `+ ${formatCurrency(sidesPricing.sidesPricePerPerson)} / ${perPerson}`,
            },
            {
              label: getPackagePriceLineLabel('total', language),
              value: `${formatCurrency(sidesPricing.totalPerPerson)} / ${perPerson}`,
              emphasis: true,
            },
          ]
        : [
            {
              label: getPackagePriceLineLabel('total', language),
              value: `${formatCurrency(sidesPricing?.totalPerPerson ?? packagePrice)} / ${perPerson}`,
              emphasis: true,
            },
          ]

  const garnishBadge =
    variant === 'with_sides' ? 'Com guarnições' : 'Sem guarnições'

  const imageBlock = (
    <div
      className={
        layout === 'split'
          ? 'w-full bg-neutral-50 lg:w-[42%] lg:shrink-0'
          : 'w-full bg-neutral-50'
      }
    >
      <div className="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-square lg:min-h-[280px]">
        <CatalogImageFrame
          src={image}
          alt={commercialName}
          variant="package"
          fallbackLabel="Imagem do pacote não cadastrada"
          rounded="none"
          className="!h-full !min-h-0 !max-h-none !w-full !rounded-none"
        />
      </div>
    </div>
  )

  const infoBlock = (
    <div className="space-y-4 p-5 sm:p-6 lg:flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
          {pkg.package_key}
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            variant === 'with_sides'
              ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
              : 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200'
          }`}
        >
          {garnishBadge}
        </span>
        {selected ? <StatusBadge active label="Selecionado" /> : null}
      </div>

      <div>
        <h3 className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">
          {commercialName}
        </h3>
      </div>

      <p className="text-sm leading-relaxed text-neutral-700">
        <span className="font-bold text-neutral-900">Itens do pacote:</span>{' '}
        {itemsText}
      </p>
      <p className="text-sm leading-relaxed text-neutral-700">
        <span className="font-bold text-neutral-900">Guarnições:</span>{' '}
        {garnishText}
      </p>

      <PriceBreakdownCard rows={breakdownRows} />
    </div>
  )

  return (
    <PremiumCard
      className={
        selected
          ? 'overflow-hidden ring-2 ring-emerald-400 ring-offset-2'
          : 'overflow-hidden'
      }
    >
      {layout === 'split' ? (
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {imageBlock}
          {infoBlock}
        </div>
      ) : (
        <>
          {imageBlock}
          {infoBlock}
        </>
      )}
    </PremiumCard>
  )
}
