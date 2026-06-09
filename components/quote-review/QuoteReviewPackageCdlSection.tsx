'use client'

import type { ReactNode } from 'react'
import CatalogImageFrame from '@/components/CatalogImageFrame'
import {
  formatCountOrDash,
  formatMoneyOrDash,
} from '@/Lib/readQuoteSnapshot'
import { displayValue, formatCurrency } from '@/app/quotes/[id]/quoteDetailTypes'
import type { QuoteReviewPackageSummary } from './quoteReviewPackageSummary'

function PackageDetailLine({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <p className="quote-proposal-package-detail">
      <span className="quote-proposal-package-detail-label">{label}</span>{' '}
      {value}
    </p>
  )
}

function PackageSummaryHighlightCard({
  label,
  value,
  subValue,
  variant = 'default',
}: {
  label: string
  value: ReactNode
  subValue?: ReactNode
  variant?: 'default' | 'price' | 'grand-total'
}) {
  const variantClass =
    variant === 'grand-total'
      ? ' quote-proposal-highlight-card--grand-total'
      : variant === 'price'
        ? ' quote-proposal-highlight-card--price'
        : ''

  return (
    <div className={`quote-proposal-highlight-card${variantClass}`}>
      <span className="quote-proposal-label">{label}</span>
      <p className="quote-proposal-highlight-value">{value}</p>
      {subValue ? (
        <p className="quote-proposal-muted mt-1 text-xs">{subValue}</p>
      ) : null}
    </div>
  )
}

function PackageSummaryCards({
  summary,
  fallback,
}: {
  summary: QuoteReviewPackageSummary | null | undefined
  fallback: {
    physicalGuestCount: number | null
    billableGuestCount: number | null
    packageTotal: number | null
    packageUnitPrice: number | null
  }
}) {
  if (summary) {
    const garnishValue = summary.hasGarnish
      ? formatMoneyOrDash(summary.garnishTotalPrice)
      : '$0.00'

    return (
      <div className="quote-proposal-highlight-grid">
        <PackageSummaryHighlightCard
          label="Convidados físicos"
          value={formatCountOrDash(fallback.physicalGuestCount)}
        />
        <PackageSummaryHighlightCard
          label="Pessoas cobradas equivalentes"
          value={formatCountOrDash(summary.chargedPeople)}
        />
        <PackageSummaryHighlightCard
          label="Valor do pacote"
          value={formatMoneyOrDash(summary.packageTotalPrice)}
          subValue={
            summary.chargedPeople > 0
              ? `${formatCurrency(summary.packageUnitPrice)} × ${summary.chargedPeople}`
              : undefined
          }
          variant="price"
        />
        <PackageSummaryHighlightCard
          label="Valor das guarnições"
          value={garnishValue}
          subValue={
            summary.hasGarnish && summary.chargedPeople > 0
              ? `${formatCurrency(summary.garnishUnitPrice)} × ${summary.chargedPeople}`
              : summary.hasGarnish
                ? undefined
                : 'Não'
          }
          variant="price"
        />
        <PackageSummaryHighlightCard
          label="Valor total"
          value={formatMoneyOrDash(summary.grandTotalPrice)}
          subValue={
            summary.chargedPeople > 0
              ? `${formatCurrency(summary.totalUnitPrice)} × ${summary.chargedPeople}`
              : undefined
          }
          variant="grand-total"
        />
      </div>
    )
  }

  return (
    <div className="quote-proposal-highlight-grid">
      <PackageSummaryHighlightCard
        label="Convidados físicos"
        value={formatCountOrDash(fallback.physicalGuestCount)}
      />
      <PackageSummaryHighlightCard
        label="Pessoas cobradas equivalentes"
        value={formatCountOrDash(fallback.billableGuestCount)}
      />
      <PackageSummaryHighlightCard
        label="Valor do pacote"
        value={formatMoneyOrDash(fallback.packageTotal)}
        subValue={
          fallback.packageUnitPrice != null &&
          fallback.billableGuestCount != null &&
          fallback.billableGuestCount > 0
            ? `${formatCurrency(fallback.packageUnitPrice)} × ${fallback.billableGuestCount}`
            : undefined
        }
        variant="price"
      />
      <PackageSummaryHighlightCard
        label="Valor das guarnições"
        value="$0.00"
        subValue="Não"
        variant="price"
      />
      <PackageSummaryHighlightCard
        label="Valor total"
        value={formatMoneyOrDash(fallback.packageTotal)}
        subValue={
          fallback.packageUnitPrice != null &&
          fallback.billableGuestCount != null &&
          fallback.billableGuestCount > 0
            ? `${formatCurrency(fallback.packageUnitPrice)} × ${fallback.billableGuestCount}`
            : undefined
        }
        variant="grand-total"
      />
    </div>
  )
}

export default function QuoteReviewPackageCdlSection({
  packageName,
  packageImageUrl,
  packageSummary,
  physicalGuestCount,
  billableGuestCount,
  packageTotal,
  packageUnitPrice,
}: {
  packageName: string | null
  packageImageUrl?: string | null
  packageSummary?: QuoteReviewPackageSummary | null
  physicalGuestCount: number | null
  billableGuestCount: number | null
  packageTotal: number | null
  packageUnitPrice: number | null
}) {
  return (
    <>
      <p className="quote-proposal-package-name">{displayValue(packageName)}</p>
      <div className="mt-5 flex w-full items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <CatalogImageFrame
          src={packageImageUrl}
          alt={packageName ?? 'Pacote'}
          variant="package"
          fallbackLabel="Imagem do pacote não cadastrada"
          rounded="none"
          className="!aspect-square !min-h-0 !max-h-[min(85vw,20rem)] !w-full !bg-white sm:!aspect-[4/3] sm:!max-h-[18rem]"
        />
      </div>
      {packageSummary?.packageItemsDescription ? (
        <PackageDetailLine
          label="Itens do pacote:"
          value={packageSummary.packageItemsDescription}
        />
      ) : null}
      <PackageDetailLine
        label="Guarnições:"
        value={packageSummary?.garnishDescription ?? 'Não'}
      />
      <PackageSummaryCards
        summary={packageSummary}
        fallback={{
          physicalGuestCount,
          billableGuestCount,
          packageTotal,
          packageUnitPrice,
        }}
      />
    </>
  )
}
