import React from 'react'
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import {
  BALANCE_PERCENTAGE,
  CANCELLATION_POLICY_SUMMARY,
  IMPORTANT_RULES,
  RESERVATION_PAYMENT_TEXT,
  RESERVATION_PERCENTAGE,
} from '@/Lib/cdlCommercialRules'
import { calculateQuoteTotalsFromQuoteRecord } from '@/Lib/calculateQuoteTotals'
import {
  type QuoteDetail,
  displayValue,
  formatBool,
  formatCurrency,
  formatDate,
  formatTime,
  getAdditionalLabel,
  getChargedMiles,
  getDiscount,
  getPackageDescription,
  getPackageName,
  getZipCode,
  groupAdditionalsByCategory,
} from './quoteDetailTypes'

const colors = {
  gold: '#F4B400',
  dark: '#111111',
  muted: '#6B6560',
  border: '#E8E2D9',
  light: '#FAF7F2',
  white: '#FFFFFF',
  accent: '#D62828',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: colors.dark,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.dark,
    marginHorizontal: -40,
    marginTop: -36,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 22,
    marginBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: colors.gold,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    letterSpacing: 1.5,
  },
  headerTagline: {
    marginTop: 4,
    fontSize: 8,
    color: colors.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerLocation: {
    marginTop: 2,
    fontSize: 8,
    color: '#CCCCCC',
  },
  headerMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  metaCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 110,
  },
  metaLabel: {
    fontSize: 7,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaValue: {
    marginTop: 3,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  overview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  overviewItem: {
    flexGrow: 1,
    minWidth: '22%',
    backgroundColor: colors.light,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  overviewTotal: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  overviewLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  overviewValue: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
  },
  overviewTotalLabel: {
    fontSize: 7,
    color: '#BBBBBB',
    textTransform: 'uppercase',
  },
  overviewTotalValue: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  packageName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 8,
    color: colors.muted,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.light,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  gridItemWide: {
    width: '100%',
    backgroundColor: colors.light,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  cellLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cellValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  highlightGold: {
    color: colors.gold,
  },
  categoryTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  additionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  additionalName: {
    flex: 1,
    fontSize: 8,
    paddingRight: 8,
  },
  additionalMeta: {
    fontSize: 8,
    color: colors.muted,
    textAlign: 'right',
  },
  pricingCard: {
    backgroundColor: colors.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pricingRowHighlight: {
    fontFamily: 'Helvetica-Bold',
  },
  pricingRowAccent: {
    color: colors.accent,
  },
  totalBox: {
    marginTop: 10,
    backgroundColor: colors.dark,
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 8,
    color: '#BBBBBB',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
  },
  reservationNote: {
    marginTop: 8,
    fontSize: 7.5,
    color: colors.muted,
    lineHeight: 1.4,
  },
  rulesBlock: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: colors.light,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rulesSubtitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  rulesItem: {
    fontSize: 7.5,
    color: colors.dark,
    lineHeight: 1.35,
    marginBottom: 2,
  },
  footer: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    textAlign: 'center',
  },
  footerBrand: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  footerTagline: {
    marginTop: 2,
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footerMeta: {
    marginTop: 4,
    fontSize: 6.5,
    color: colors.muted,
  },
  muted: {
    fontSize: 8,
    color: colors.muted,
    fontStyle: 'italic',
  },
})

function InfoCell({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <View style={wide ? styles.gridItemWide : styles.gridItem}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  )
}

function RulesBlock({
  title,
  items,
}: {
  title: string
  items: readonly string[]
}) {
  return (
    <View style={styles.rulesBlock}>
      <Text style={styles.rulesSubtitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.rulesItem}>
          • {item}
        </Text>
      ))}
    </View>
  )
}

export function QuotePdfDocument({ quote }: { quote: QuoteDetail }) {
  const lang = quote.language ?? 'pt'
  const packageName = getPackageName(quote) ?? '—'
  const packageDescription = getPackageDescription(quote)
  const groupedAdditionals = groupAdditionalsByCategory(
    quote.additional_items ?? [],
    lang,
  )
  const chargedMiles = getChargedMiles(quote)
  const discount = getDiscount(quote)
  const quoteNumber = quote.quote_number ?? 'CDL-Q-0000'
  const quoteDate = formatDate(quote.created_at)
  const cityState = [quote.city, quote.state].filter(Boolean).join(', ')
  const eventLocation = [quote.address_line, cityState, getZipCode(quote)]
    .filter(Boolean)
    .join(' · ')

  const { guestCounts, totals: quoteTotals } =
    calculateQuoteTotalsFromQuoteRecord(quote)
  const packageUnitPrice = Number(
    quote.package_price_per_person ?? quote.package_unit_price ?? 0,
  )

  const pricingLines = [
    { label: 'Pacote', value: formatCurrency(quoteTotals.packageTotal) },
    { label: 'Adicionais', value: formatCurrency(quoteTotals.additionalTotal) },
    { label: 'Milhagem', value: formatCurrency(quoteTotals.mileageFee) },
    { label: 'Desconto', value: formatCurrency(discount), accent: true },
    { label: 'Reserva', value: formatCurrency(quoteTotals.reservationAmount) },
    {
      label: 'Saldo a pagar',
      value: formatCurrency(quoteTotals.balanceDue),
      highlight: true,
    },
  ]

  return (
    <Document
      title={`${quoteNumber} — Proposta BBQ At Home`}
      author="CDL Catering AI Platform"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BBQ AT HOME</Text>
          <Text style={styles.headerTagline}>
            Premium Brazilian BBQ Experience
          </Text>
          <Text style={styles.headerLocation}>Orlando, Florida</Text>
          <View style={styles.headerMetaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Cotação</Text>
              <Text style={styles.metaValue}>{quoteNumber}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Data da cotação</Text>
              <Text style={styles.metaValue}>{quoteDate}</Text>
            </View>
            {quote.quote_status ? (
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={styles.metaValue}>{quote.quote_status}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.overview}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Cliente</Text>
            <Text style={styles.overviewValue}>
              {displayValue(quote.customer_name)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Evento</Text>
            <Text style={styles.overviewValue}>
              {formatDate(quote.event_date)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Local</Text>
            <Text style={styles.overviewValue}>
              {displayValue(cityState || quote.city)}
            </Text>
          </View>
          <View style={[styles.overviewItem, styles.overviewTotal]}>
            <Text style={styles.overviewTotalLabel}>Investimento</Text>
            <Text style={styles.overviewTotalValue}>
              {formatCurrency(quoteTotals.quoteTotal)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pacote CDL</Text>
          <Text style={styles.packageName}>{packageName}</Text>
          {packageDescription ? (
            <Text style={styles.packageDesc}>{packageDescription}</Text>
          ) : null}
          <View style={styles.grid2}>
            <InfoCell label="Adultos" value={String(guestCounts.adultCount)} />
            <InfoCell
              label="Crianças até 3 anos"
              value={String(guestCounts.childrenUnder3Count)}
            />
            <InfoCell
              label="Crianças 4 a 12 anos"
              value={String(guestCounts.children4To12Count)}
            />
            <InfoCell
              label="Convidados físicos"
              value={String(quoteTotals.physicalGuestTotal)}
            />
            <InfoCell
              label="Pessoas cobradas equivalentes"
              value={String(quoteTotals.billableGuests)}
            />
            <InfoCell
              label="Valor do pacote"
              value={formatCurrency(quoteTotals.packageTotal)}
            />
          </View>
          {packageUnitPrice > 0 && quoteTotals.billableGuests > 0 ? (
            <Text style={styles.packageDesc}>
              {formatCurrency(packageUnitPrice)} × {quoteTotals.billableGuests}{' '}
              pessoas cobradas equivalentes
            </Text>
          ) : null}
          {guestCounts.usingLegacyFallback ? (
            <Text style={styles.muted}>
              Fallback legado: campos children_under_3_count e
              children_4_to_12_count ausentes no Supabase.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evento</Text>
          <Text style={styles.packageName}>
            {displayValue(quote.event_name ?? quote.customer_name)}
          </Text>
          <View style={styles.grid2}>
            <InfoCell label="Data" value={formatDate(quote.event_date)} />
            <InfoCell
              label="Horário"
              value={`${formatTime(quote.start_time)} – ${formatTime(quote.end_time)}`}
            />
            <InfoCell
              label="Local"
              value={eventLocation || '—'}
              wide
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Churrasqueira</Text>
          <View style={styles.grid2}>
            <InfoCell
              label="Cliente tem churrasqueira?"
              value={formatBool(quote.has_grill)}
            />
            <InfoCell
              label="Foto pendente para validação?"
              value={formatBool(quote.grill_photo_required)}
            />
            <InfoCell
              label="Necessário alugar churrasqueira?"
              value={formatBool(quote.grill_rental_required)}
            />
            <InfoCell
              label="Quantidade para aluguel"
              value={
                quote.grill_rental_required
                  ? displayValue(quote.grill_rental_qty)
                  : '—'
              }
            />
            <InfoCell
              label="Churrasqueiros"
              value={displayValue(quote.grill_masters_qty)}
            />
            <InfoCell
              label="Assistentes"
              value={displayValue(quote.assistants_qty)}
            />
            {quote.grill_notes ? (
              <InfoCell
                label="Observações"
                value={quote.grill_notes}
                wide
              />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milhagem</Text>
          <View style={styles.grid2}>
            <InfoCell
              label="Local base"
              value={displayValue(quote.mileage_base_location)}
            />
            <InfoCell
              label="Distância"
              value={
                quote.mileage_distance != null
                  ? `${quote.mileage_distance} mi`
                  : '—'
              }
            />
            <InfoCell
              label="Milhas inclusas"
              value={
                quote.mileage_free_limit != null
                  ? `${quote.mileage_free_limit} mi`
                  : '—'
              }
            />
            <InfoCell label="Milhas cobradas" value={`${chargedMiles} mi`} />
            <InfoCell
              label="Taxa"
              value={
                quote.mileage_rate != null
                  ? `${formatCurrency(quote.mileage_rate)}/mi`
                  : '—'
              }
            />
            <InfoCell
              label="Taxa de milhagem"
              value={formatCurrency(quote.mileage_fee)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionais selecionados</Text>
          {groupedAdditionals.length === 0 ? (
            <Text style={styles.muted}>Nenhum adicional selecionado.</Text>
          ) : (
            groupedAdditionals.map(({ category, items }) => (
              <View key={category}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((item) => (
                  <View key={item.item_id} style={styles.additionalRow}>
                    <Text style={styles.additionalName}>
                      {getAdditionalLabel(item, lang)}
                    </Text>
                    <Text style={styles.additionalMeta}>
                      Qtd. {displayValue(item.quantity)} ·{' '}
                      {formatCurrency(item.unit_price)}/un ·{' '}
                      {formatCurrency(item.total_price)}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo financeiro</Text>
          <View style={styles.pricingCard}>
            {pricingLines.map((line) => (
              <View
                key={line.label}
                style={[
                  styles.pricingRow,
                  ...(line.highlight ? [styles.pricingRowHighlight] : []),
                  ...(line.accent ? [styles.pricingRowAccent] : []),
                ]}
              >
                <Text>{line.label}</Text>
                <Text>{line.value}</Text>
              </View>
            ))}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total da cotação</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quoteTotals.quoteTotal)}
              </Text>
            </View>
            <Text style={styles.reservationNote}>{RESERVATION_PAYMENT_TEXT}</Text>
            <Text style={styles.reservationNote}>
              Reserva: {RESERVATION_PERCENTAGE}% · Saldo: {BALANCE_PERCENTAGE}%
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regras comerciais</Text>
          <RulesBlock title="Pedido mínimo" items={IMPORTANT_RULES.minimumOrder} />
          <RulesBlock title="Milhagem" items={IMPORTANT_RULES.mileage} />
          <RulesBlock title="Reserva" items={IMPORTANT_RULES.reservation} />
          <RulesBlock title="Política de comida" items={IMPORTANT_RULES.foodPolicy} />
          <RulesBlock title="Multa de atraso" items={IMPORTANT_RULES.latePayment} />
          <RulesBlock
            title="Dezembro / janeiro e feriados"
            items={IMPORTANT_RULES.decemberJanuary}
          />
          <RulesBlock
            title="Política de cancelamento"
            items={CANCELLATION_POLICY_SUMMARY}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>BBQ AT HOME</Text>
          <Text style={styles.footerTagline}>
            Premium Brazilian BBQ Experience
          </Text>
          <Text style={styles.footerMeta}>
            Generated by: CDL Catering AI Platform · Version 1.0
          </Text>
        </View>
      </Page>
    </Document>
  )
}
