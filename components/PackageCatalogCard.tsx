'use client'

import {
  formatPackageCatalogPriceLabel,
  getPackageCatalogImage,
  getPackageCatalogName,
  getPackageCatalogVariant,
  getPackageSidesSummary,
  isPackageCatalogPriceOnRequest,
  type PackageCatalogFields,
} from '@/Lib/packageCatalogVisual'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function CatalogImagePlaceholder() {
  return (
    <div className="flex aspect-[5/6] w-full items-center justify-center bg-cdl-muted-bg text-cdl-faint sm:aspect-[4/5]">
      <span className="px-2 text-center text-[9px] font-semibold uppercase leading-tight tracking-wider sm:text-[10px]">
        SEM IMAGEM
      </span>
    </div>
  )
}

export default function PackageCatalogCard({
  pkg,
  language = 'pt',
  selected = false,
  onSelect,
  onSelectAndAdvance,
  autoAdvanceOnSelect = false,
}: {
  pkg: PackageCatalogFields & { id?: string }
  language?: QuoteLanguage
  selected?: boolean
  onSelect: () => void
  onSelectAndAdvance: () => void
  autoAdvanceOnSelect?: boolean
}) {
  const image = getPackageCatalogImage(pkg)
  const variant = getPackageCatalogVariant(pkg)
  const name = getPackageCatalogName(pkg, language)
  const priceOnRequest = isPackageCatalogPriceOnRequest(pkg)
  const priceLabel = formatPackageCatalogPriceLabel(
    pkg,
    language,
    formatCurrency,
  )
  const sidesSummary =
    variant === 'with_sides' ? getPackageSidesSummary(language) : null

  return (
    <button
      type="button"
      onClick={autoAdvanceOnSelect ? onSelectAndAdvance : onSelect}
      onDoubleClick={onSelectAndAdvance}
      title={
        autoAdvanceOnSelect
          ? 'Selecionar pacote e continuar'
          : 'Duplo clique para ir aos adicionais'
      }
      className={`relative flex h-full flex-col overflow-hidden rounded-lg border text-left shadow-cdl transition-colors sm:rounded-xl ${
        selected
          ? 'border-cdl-success-border bg-cdl-success-soft ring-1 ring-cdl-success-border'
          : 'border-cdl-border bg-cdl-inset hover:border-cdl-accent-border'
      }`}
    >
      {selected && (
        <span className="absolute right-1 top-1 z-10 rounded-full border border-cdl-success-border bg-cdl-success-soft px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-cdl-success sm:right-2 sm:top-2 sm:px-2 sm:py-0.5 sm:text-[9px]">
          ✓
        </span>
      )}

      {image ? (
        <div className="aspect-[5/6] w-full shrink-0 overflow-hidden bg-cdl-image sm:aspect-[4/5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <CatalogImagePlaceholder />
      )}

      <div className="flex min-h-0 flex-1 flex-col justify-end p-1.5 sm:p-2.5 lg:p-3">
        <p className="truncate text-[9px] font-bold uppercase tracking-wide text-cdl-muted sm:text-[10px]">
          {pkg.package_key}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[11px] font-extrabold leading-tight text-cdl-title sm:text-sm lg:text-base">
          {name}
        </h3>
        {sidesSummary && (
          <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-cdl-text-secondary sm:text-[10px]">
            {sidesSummary}
          </p>
        )}
        <p
          className={`mt-1 font-black text-cdl-price ${
            priceOnRequest
              ? 'text-[10px] uppercase tracking-wide sm:text-xs'
              : 'text-xs sm:text-base lg:text-lg'
          }`}
        >
          {priceLabel}
        </p>
      </div>
    </button>
  )
}
