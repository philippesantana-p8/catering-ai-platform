'use client'

import { formatMoneyOrDash } from '@/Lib/readQuoteSnapshot'
import { formatDate } from '@/app/quotes/[id]/quoteDetailTypes'
import type { QuoteReviewPackageSummary } from './quoteReviewPackageSummary'

export type QuoteFinancialLine = {
  label: string
  value: string
  emphasis?: boolean
  subtle?: boolean
}

export function buildQuoteFinancialLines(input: {
  packageSummary?: QuoteReviewPackageSummary | null
  packageTotal: number | null
  additionalTotal: number | null
  mileageFee: number | null
  reservationAmount?: number | null
  quoteTotal: number | null
}): QuoteFinancialLine[] {
  const lines: QuoteFinancialLine[] = []
  const summary = input.packageSummary

  if (summary?.hasGarnish) {
    if ((summary.packageTotalPrice ?? 0) > 0) {
      lines.push({
        label: 'Pacote',
        value: formatMoneyOrDash(summary.packageTotalPrice),
      })
    }
    if ((summary.garnishTotalPrice ?? 0) > 0) {
      lines.push({
        label: 'Guarnições',
        value: formatMoneyOrDash(summary.garnishTotalPrice),
      })
    }
  } else if ((input.packageTotal ?? 0) > 0) {
    lines.push({
      label: 'Pacote',
      value: formatMoneyOrDash(input.packageTotal),
    })
  }

  if ((input.additionalTotal ?? 0) > 0) {
    lines.push({
      label: 'Itens adicionais',
      value: formatMoneyOrDash(input.additionalTotal),
    })
  }

  if ((input.mileageFee ?? 0) > 0) {
    lines.push({
      label: 'Milhagem',
      value: formatMoneyOrDash(input.mileageFee),
    })
  }

  lines.push({
    label: 'Total',
    value: formatMoneyOrDash(input.quoteTotal),
    emphasis: true,
  })

  if ((input.reservationAmount ?? 0) > 0) {
    lines.push({
      label: 'Reserva (sinal)',
      value: formatMoneyOrDash(input.reservationAmount),
      subtle: true,
    })
  }

  return lines
}

export default function QuoteProposalOverviewCard({
  customerName,
  eventDate,
  addressLine,
  city,
  state,
  zipCode,
  packageSummary,
  packageTotal,
  additionalTotal,
  mileageFee,
  reservationAmount = null,
  quoteTotal,
  additionalsCount = 0,
  grillRentalRequired = false,
}: {
  customerName: string
  eventDate: string | null
  addressLine?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  packageSummary?: QuoteReviewPackageSummary | null
  packageTotal: number | null
  additionalTotal: number | null
  mileageFee: number | null
  reservationAmount?: number | null
  quoteTotal: number | null
  additionalsCount?: number
  grillRentalRequired?: boolean | null
}) {
  const cityState = [city, state].filter(Boolean).join(', ')
  const streetLine = [addressLine, zipCode].filter(Boolean).join(' · ')
  const financialLines = buildQuoteFinancialLines({
    packageSummary,
    packageTotal,
    additionalTotal,
    mileageFee,
    reservationAmount,
    quoteTotal,
  })

  return (
    <div className="quote-proposal-overview quote-proposal-overview--enhanced">
      <div className="quote-proposal-overview-top">
        <div className="quote-proposal-overview-item">
          <span className="quote-proposal-label">Cliente</span>
          <p className="quote-proposal-value">{customerName || '—'}</p>
        </div>
        <div className="quote-proposal-overview-item">
          <span className="quote-proposal-label">Evento</span>
          <p className="quote-proposal-value">{formatDate(eventDate)}</p>
        </div>
      </div>

      <div className="quote-proposal-overview-location">
        <span className="quote-proposal-label">Local</span>
        {cityState ? (
          <p className="quote-proposal-location-primary">{cityState}</p>
        ) : null}
        {streetLine ? (
          <p className="quote-proposal-location-secondary">{streetLine}</p>
        ) : !cityState ? (
          <p className="quote-proposal-location-secondary">—</p>
        ) : null}
      </div>

      {(packageSummary?.hasGarnish ||
        additionalsCount > 0 ||
        grillRentalRequired) && (
        <div className="quote-proposal-overview-badges">
          {packageSummary?.hasGarnish ? (
            <span className="quote-proposal-overview-badge">Com guarnições</span>
          ) : null}
          {additionalsCount > 0 ? (
            <span className="quote-proposal-overview-badge">
              {additionalsCount} adicional{additionalsCount !== 1 ? 'is' : ''}
            </span>
          ) : null}
          {grillRentalRequired ? (
            <span className="quote-proposal-overview-badge">
              Churrasqueira para alugar
            </span>
          ) : null}
        </div>
      )}

      <div className="quote-proposal-overview-finance">
        <p className="quote-proposal-label">Resumo financeiro</p>
        <div className="quote-proposal-finance-lines">
          {financialLines.map((line) => (
            <div
              key={line.label}
              className={`quote-proposal-finance-row${
                line.emphasis ? ' quote-proposal-finance-row--total' : ''
              }${line.subtle ? ' quote-proposal-finance-row--subtle' : ''}`}
            >
              <span>{line.label}</span>
              <span>{line.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
