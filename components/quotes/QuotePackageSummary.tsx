'use client'

import CatalogImageFrame from '@/components/CatalogImageFrame'
import { PriceBreakdownCard, PremiumCard, StatusBadge } from '@/components/premium/PremiumPrimitives'
import {
  findBasePackage,
  formatPackageCatalogPriceLabel,
  getPackageCatalogImage,
  getPackageCatalogName,
  getPackageCatalogVariant,
  getPackagePriceLineLabel,
  isPackageCatalogPriceOnRequest,
  resolvePackageSidesPricing,
  type PackageCatalogFields,
} from '@/Lib/packageCatalogVisual'
import {
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

export default function QuotePackageSummary({
  pkg,
  allPackages = [],
  language = 'pt',
  sidesPricePerPerson = 13,
  selected = false,
  onSelect,
  onSelectAndAdvance,
  showActions = true,
}: {
  pkg: PackageCatalogFields & { id?: string }
  allPackages?: ReadonlyArray<PackageCatalogFields>
  language?: QuoteLanguage
  sidesPricePerPerson?: number
  selected?: boolean
  onSelect?: () => void
  onSelectAndAdvance?: () => void
  showActions?: boolean
}) {
  const image = getPackageCatalogImage(pkg, allPackages)
  const variant = getPackageCatalogVariant(pkg)
  const name = getPackageCatalogName(pkg, language)
  const priceOnRequest = isPackageCatalogPriceOnRequest(pkg)
  const perPerson = perPersonSuffix(language)
  const basePackage = findBasePackage(pkg, allPackages)
  const sidesPricing =
    variant === 'with_sides'
      ? resolvePackageSidesPricing(pkg, basePackage, sidesPricePerPerson)
      : null

  const itemsText = getPackageItemsDisplayText(pkg, language) || '—'
  const garnishText =
    variant === 'with_sides'
      ? getPackageGarnishDisplayText(pkg, language)
      : language === 'en'
        ? 'Not included'
        : language === 'es'
          ? 'No incluidas'
          : 'Não inclusas'

  const breakdownRows =
    priceOnRequest || !sidesPricing
      ? [
          {
            label: getPackagePriceLineLabel('package', language),
            value: formatPackageCatalogPriceLabel(pkg, language, formatCurrency),
            emphasis: true,
          },
        ]
      : sidesPricing.mode === 'breakdown' &&
          sidesPricing.basePricePerPerson != null
        ? [
            {
              label: getPackagePriceLineLabel('package', language),
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
              value: `${formatCurrency(sidesPricing.totalPerPerson)} / ${perPerson}`,
              emphasis: true,
            },
          ]

  return (
    <PremiumCard className={selected ? 'ring-2 ring-red-200' : ''}>
      <div className="aspect-[4/3] w-full bg-neutral-50 sm:aspect-[16/10]">
        <CatalogImageFrame
          src={image}
          alt={name}
          variant="package"
          fallbackLabel="Imagem do pacote não cadastrada"
          rounded="none"
          className="!h-full !min-h-0 !max-h-none !w-full !rounded-none"
        />
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            {pkg.package_key}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              variant === 'with_sides'
                ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'
                : 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200'
            }`}
          >
            {variant === 'with_sides' ? 'Com guarnições' : 'Sem guarnições'}
          </span>
          {selected ? <StatusBadge active label="Selecionado" /> : null}
        </div>

        <div>
          <h3 className="text-2xl font-black text-neutral-900">{name}</h3>
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

        {showActions && (onSelect || onSelectAndAdvance) ? (
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
              >
                Selecionar
              </button>
            ) : null}
            {onSelectAndAdvance ? (
              <button
                type="button"
                onClick={onSelectAndAdvance}
                className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                Selecionar e continuar
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </PremiumCard>
  )
}
