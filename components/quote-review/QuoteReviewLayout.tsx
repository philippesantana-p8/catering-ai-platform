'use client'

import type { ReactNode } from 'react'
import CdlBrandLogo from '@/components/CdlBrandLogo'
import {
  CdlImportantRulesPanel,
  CdlPdfPoliciesSection,
} from '@/components/CdlImportantRulesPanel'
import GuestBreakdownPanel from '@/components/GuestBreakdownPanel'
import {
  BALANCE_PERCENTAGE,
  RESERVATION_PAYMENT_TEXT,
  RESERVATION_PERCENTAGE,
} from '@/Lib/cdlCommercialRules'
import {
  formatCountOrDash,
  formatMoneyOrDash,
} from '@/Lib/readQuoteSnapshot'
import {
  displayValue,
  formatBool,
  formatCurrency,
  formatDate,
  formatTime,
} from '@/app/quotes/[id]/quoteDetailTypes'
import {
  AdditionalPlaceholder,
  IconCalendar,
  IconClock,
  IconLocation,
} from './QuoteReviewIcons'
import type { QuoteReviewAdditional, QuoteReviewData } from './quoteReviewTypes'

function ProposalSection({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`quote-proposal-section quote-print-section ${className}`}
    >
      <h2 className="quote-proposal-section-title">{title}</h2>
      {children}
    </section>
  )
}

function EventRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="quote-proposal-event-row">
      <div className="quote-proposal-event-icon" aria-hidden>
        {icon}
      </div>
      <div className="quote-proposal-event-copy">
        <span className="quote-proposal-label">{label}</span>
        <p className="quote-proposal-value">{displayValue(value)}</p>
      </div>
    </div>
  )
}

function groupAdditionals(items: QuoteReviewAdditional[]) {
  const groups = new Map<string, QuoteReviewAdditional[]>()
  for (const item of items) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }
  return Array.from(groups.entries()).map(([category, categoryItems]) => ({
    category,
    items: categoryItems,
  }))
}

function getChargedMiles(
  distance: number | null,
  freeLimit: number | null,
): number | null {
  if (distance == null || freeLimit == null) return null
  return Math.max(0, distance - freeLimit)
}

export default function QuoteReviewLayout({
  data,
  rulesVariant = 'summary',
  beforeBody,
  afterBody,
  showFooter = false,
}: {
  data: QuoteReviewData
  rulesVariant?: 'summary' | 'pdf'
  beforeBody?: ReactNode
  afterBody?: ReactNode
  showFooter?: boolean
}) {
  const cityState = [data.city, data.state].filter(Boolean).join(', ')
  const eventLocation = [data.addressLine, cityState, data.zipCode]
    .filter(Boolean)
    .join(' · ')
  const eventTimeLabel =
    data.startTime || data.endTime
      ? `${formatTime(data.startTime)} – ${formatTime(data.endTime)}`
      : '—'
  const groupedAdditionals = groupAdditionals(data.additionals)
  const chargedMiles = getChargedMiles(
    data.mileageDistance,
    data.mileageFreeLimit,
  )
  const discount = data.discount ?? 0

  const pricingLines = [
    { label: 'Pacote', value: formatMoneyOrDash(data.packageTotal) },
    {
      label: 'Adicionais',
      value: formatMoneyOrDash(data.additionalTotal),
    },
    { label: 'Milhagem', value: formatMoneyOrDash(data.mileageFee) },
    ...(discount > 0
      ? [{ label: 'Desconto', value: formatCurrency(discount), accent: true }]
      : []),
    {
      label: 'Reserva',
      value: formatMoneyOrDash(data.reservationAmount),
    },
    {
      label: 'Saldo a pagar',
      value: formatMoneyOrDash(data.balanceDue),
      highlight: true,
    },
  ]

  const heroMeta = data.preview
    ? [
        { label: 'Prévia', value: 'Antes de salvar' },
        { label: 'Data do evento', value: formatDate(data.eventDate) },
        { label: 'Horário', value: eventTimeLabel },
        { label: 'Status', value: 'Rascunho', status: true },
      ]
    : [
        { label: 'Cotação', value: data.quoteNumber ?? '—' },
        { label: 'Data do evento', value: formatDate(data.eventDate) },
        { label: 'Horário', value: eventTimeLabel },
        ...(data.quoteStatus
          ? [{ label: 'Status', value: data.quoteStatus, status: true }]
          : []),
      ]

  return (
    <div className="quote-proposal overflow-x-hidden">
      <header className="quote-proposal-hero quote-print-header">
        <div className="quote-proposal-hero-inner">
          <div className="quote-proposal-hero-brand">
            <div className="quote-print-logo">
              <CdlBrandLogo
                size="lg"
                variant="cover"
                className="quote-print-logo-mark"
              />
            </div>
            <div className="quote-proposal-hero-copy">
              <h1 className="quote-proposal-title">BBQ AT HOME</h1>
              <p className="quote-proposal-tagline">
                Premium Brazilian BBQ Experience
              </p>
              <p className="quote-proposal-location">Orlando, Florida</p>
            </div>
          </div>
          <div className="quote-proposal-hero-meta">
            {heroMeta.map((item) => (
              <div
                key={item.label}
                className={`quote-proposal-meta-card${
                  item.status ? ' quote-proposal-meta-card--status' : ''
                }`}
              >
                <span className="quote-proposal-label">{item.label}</span>
                <p className="quote-proposal-meta-value">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="quote-proposal-body mx-auto max-w-6xl px-4 pb-10 sm:px-8 sm:pb-12">
        {beforeBody}

        <div className="quote-proposal-overview">
          <div className="quote-proposal-overview-item">
            <span className="quote-proposal-label">Cliente</span>
            <p className="quote-proposal-value">{displayValue(data.customerName)}</p>
          </div>
          <div className="quote-proposal-overview-item">
            <span className="quote-proposal-label">Evento</span>
            <p className="quote-proposal-value">{formatDate(data.eventDate)}</p>
          </div>
          <div className="quote-proposal-overview-item">
            <span className="quote-proposal-label">Local</span>
            <p className="quote-proposal-value">{displayValue(cityState || data.city)}</p>
          </div>
          <div className="quote-proposal-overview-item quote-proposal-overview-item--total">
            <span className="quote-proposal-label">Investimento</span>
            <p className="quote-proposal-overview-total">
              {formatMoneyOrDash(data.quoteTotal)}
            </p>
          </div>
        </div>

        <div className="quote-proposal-grid-2">
          <ProposalSection title="Pacote CDL">
            <p className="quote-proposal-package-name">
              {displayValue(data.packageName)}
            </p>
            {data.packageDescription ? (
              <p className="quote-proposal-package-desc">{data.packageDescription}</p>
            ) : null}
            <div className="quote-proposal-highlight-grid">
              <div className="quote-proposal-highlight-card">
                <span className="quote-proposal-label">Convidados físicos</span>
                <p className="quote-proposal-highlight-value">
                  {formatCountOrDash(data.physicalGuestCount)}
                </p>
              </div>
              <div className="quote-proposal-highlight-card">
                <span className="quote-proposal-label">
                  Pessoas cobradas equivalentes
                </span>
                <p className="quote-proposal-highlight-value">
                  {formatCountOrDash(data.billableGuestCount)}
                </p>
              </div>
              <div className="quote-proposal-highlight-card quote-proposal-highlight-card--price">
                <span className="quote-proposal-label">Valor do pacote</span>
                <p className="quote-proposal-highlight-value">
                  {formatMoneyOrDash(data.packageTotal)}
                </p>
                {data.packageUnitPrice != null &&
                  data.billableGuestCount != null &&
                  data.billableGuestCount > 0 && (
                    <p className="quote-proposal-muted mt-1 text-xs">
                      {formatCurrency(data.packageUnitPrice)} ×{' '}
                      {data.billableGuestCount}
                    </p>
                  )}
              </div>
            </div>
          </ProposalSection>

          <ProposalSection title="Convidados e cobrança">
            <GuestBreakdownPanel
              guestCounts={data.guestCounts}
              totals={{
                billableGuestCount: data.billableGuestCount,
                physicalGuestCount: data.physicalGuestCount,
                quoteTotal: data.quoteTotal,
              }}
            />
          </ProposalSection>

          <ProposalSection title="Evento">
            <p className="quote-proposal-event-name">
              {displayValue(data.eventName || data.customerName)}
            </p>
            <div className="quote-proposal-event-list">
              <EventRow
                icon={<IconCalendar />}
                label="Data"
                value={formatDate(data.eventDate)}
              />
              <EventRow
                icon={<IconClock />}
                label="Horário"
                value={eventTimeLabel}
              />
              <EventRow
                icon={<IconLocation />}
                label="Local"
                value={eventLocation || '—'}
              />
            </div>
          </ProposalSection>
        </div>

        <div className="quote-proposal-grid-2">
          <ProposalSection title="Churrasqueira">
            <div className="quote-proposal-info-grid">
              <div className="quote-proposal-info-cell">
                <span className="quote-proposal-label">Cliente tem churrasqueira?</span>
                <p className="quote-proposal-value">{formatBool(data.hasGrill)}</p>
              </div>
              <div className="quote-proposal-info-cell">
                <span className="quote-proposal-label">
                  Foto da churrasqueira pendente para validação
                </span>
                <p className="quote-proposal-value">
                  {formatBool(data.grillPhotoRequired)}
                </p>
              </div>
              <div className="quote-proposal-info-cell">
                <span className="quote-proposal-label">
                  Necessário alugar churrasqueira?
                </span>
                <p className="quote-proposal-value">
                  {formatBool(data.grillRentalRequired)}
                </p>
              </div>
              <div className="quote-proposal-info-cell">
                <span className="quote-proposal-label">Quantidade para aluguel</span>
                <p className="quote-proposal-value">
                  {data.grillRentalRequired
                    ? displayValue(data.grillRentalQty)
                    : '—'}
                </p>
              </div>
              {data.grillNotes ? (
                <div className="quote-proposal-info-cell quote-proposal-info-cell--wide">
                  <span className="quote-proposal-label">Observações</span>
                  <p className="quote-proposal-value">{data.grillNotes}</p>
                </div>
              ) : null}
            </div>
          </ProposalSection>

          <ProposalSection title="Reserva">
            <div className="quote-proposal-info-grid">
              <div className="quote-proposal-info-cell">
                <span className="quote-proposal-label">Percentual de reserva</span>
                <p className="quote-proposal-value">
                  {data.reservationPercentage != null
                    ? `${data.reservationPercentage}%`
                    : '—'}
                </p>
              </div>
              <div className="quote-proposal-info-cell">
                <span className="quote-proposal-label">Valor da reserva</span>
                <p className="quote-proposal-value">
                  {formatMoneyOrDash(data.reservationAmount)}
                </p>
              </div>
              <div className="quote-proposal-info-cell">
                <span className="quote-proposal-label">Saldo a pagar</span>
                <p className="quote-proposal-value">
                  {formatMoneyOrDash(data.balanceDue)}
                </p>
              </div>
            </div>
          </ProposalSection>
        </div>

        <ProposalSection title="Milhagem" className="quote-proposal-section--compact">
          <div className="quote-proposal-mileage-grid">
            <div className="quote-proposal-info-cell">
              <span className="quote-proposal-label">Local base</span>
              <p className="quote-proposal-value">
                {displayValue(data.mileageBaseLocation)}
              </p>
            </div>
            <div className="quote-proposal-info-cell">
              <span className="quote-proposal-label">Distância</span>
              <p className="quote-proposal-value">
                {data.mileageDistance != null
                  ? `${data.mileageDistance} mi`
                  : '—'}
              </p>
            </div>
            <div className="quote-proposal-info-cell">
              <span className="quote-proposal-label">Milhas inclusas</span>
              <p className="quote-proposal-value">
                {data.mileageFreeLimit != null
                  ? `${data.mileageFreeLimit} mi`
                  : '—'}
              </p>
            </div>
            <div className="quote-proposal-info-cell">
              <span className="quote-proposal-label">Milhas cobradas</span>
              <p className="quote-proposal-value">
                {chargedMiles != null ? `${chargedMiles} mi` : '—'}
              </p>
            </div>
            <div className="quote-proposal-info-cell">
              <span className="quote-proposal-label">Taxa</span>
              <p className="quote-proposal-value">
                {data.mileageRate != null
                  ? `${formatCurrency(data.mileageRate)}/mi`
                  : '—'}
              </p>
            </div>
            <div className="quote-proposal-info-cell">
              <span className="quote-proposal-label">Taxa de milhagem</span>
              <p className="quote-proposal-value">
                {formatMoneyOrDash(data.mileageFee)}
              </p>
            </div>
          </div>
        </ProposalSection>

        <ProposalSection title="Adicionais selecionados">
          {groupedAdditionals.length === 0 ? (
            <p className="quote-proposal-muted">Nenhum adicional selecionado.</p>
          ) : (
            <div className="quote-proposal-additionals">
              {groupedAdditionals.map(({ category, items }) => (
                <section key={category} className="quote-proposal-additional-group">
                  <h3 className="quote-proposal-category-title">{category}</h3>
                  <div className="quote-print-additional-grid quote-proposal-additional-grid">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="quote-print-additional-card quote-proposal-additional-card"
                      >
                        {item.imageUrl ? (
                          <div className="quote-print-thumb quote-proposal-additional-image">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.label}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <AdditionalPlaceholder />
                        )}
                        <div className="quote-print-additional-body quote-proposal-additional-body">
                          <h4 className="quote-proposal-additional-name">{item.label}</h4>
                          <div className="quote-proposal-additional-metrics">
                            <div>
                              <span className="quote-proposal-label">Qtd.</span>
                              <p className="quote-proposal-additional-metric">
                                {displayValue(item.quantity)}
                              </p>
                            </div>
                            <div>
                              <span className="quote-proposal-label">Unit.</span>
                              <p className="quote-proposal-additional-metric">
                                {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                          </div>
                          <div className="quote-print-additional-total quote-proposal-additional-total">
                            <span className="quote-proposal-label">Total</span>
                            <p className="quote-proposal-additional-price">
                              {formatCurrency(item.totalPrice)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </ProposalSection>

        <section className="quote-proposal-pricing quote-print-section quote-print-keep">
          <h2 className="quote-proposal-section-title">Resumo financeiro</h2>
          <div className="quote-proposal-pricing-card">
            <div className="quote-proposal-pricing-lines">
              {pricingLines.map((line) => (
                <div
                  key={line.label}
                  className={`quote-proposal-pricing-row${
                    'highlight' in line && line.highlight
                      ? ' quote-proposal-pricing-row--highlight'
                      : ''
                  }${'accent' in line && line.accent ? ' quote-proposal-pricing-row--accent' : ''}`}
                >
                  <span>{line.label}</span>
                  <span>{line.value}</span>
                </div>
              ))}
            </div>
            <div className="quote-print-total-box quote-proposal-total-box">
              <span className="quote-proposal-total-label">Total da cotação</span>
              <span className="quote-print-total-value quote-proposal-total-value">
                {formatMoneyOrDash(data.quoteTotal)}
              </span>
            </div>
            <div className="quote-proposal-reservation-note">
              <p>{RESERVATION_PAYMENT_TEXT}</p>
              <p>
                Reserva: {RESERVATION_PERCENTAGE}% · Saldo: {BALANCE_PERCENTAGE}%
              </p>
            </div>
          </div>
        </section>

        {rulesVariant === 'pdf' ? (
          <CdlPdfPoliciesSection />
        ) : (
          <CdlImportantRulesPanel variant="summary" showReservationText />
        )}

        {afterBody}

        {showFooter ? (
          <footer className="quote-print-footer quote-proposal-footer">
            <p className="quote-proposal-footer-brand">BBQ AT HOME</p>
            <p className="quote-proposal-footer-tagline">
              Premium Brazilian BBQ Experience · Orlando, Florida
            </p>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
