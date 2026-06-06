import {
  MILEAGE_FREE_LIMIT,
  MILEAGE_RATE,
  RESERVATION_PERCENTAGE,
} from './cdlCommercialRules'

/** Campos presentes hoje em quote_detail_view */
export const SUPABASE_GUEST_FIELDS_EXISTING = [
  'adults_count',
  'children_count',
  'billable_guests',
] as const

/**
 * Campos desejados ainda não expostos na view/tabela.
 * Fallback temporário em resolveGuestCountsFromQuote().
 */
export const SUPABASE_GUEST_FIELDS_MISSING = [
  'adult_count',
  'children_under_3_count',
  'children_4_to_12_count',
  'billable_guest_count',
] as const

export type GuestCounts = {
  adultCount: number
  childrenUnder3Count: number
  children4To12Count: number
}

export type GuestCountsSource = 'supabase_split' | 'supabase_legacy_fallback'

export type QuoteGuestCounts = GuestCounts & {
  source: GuestCountsSource
  usingLegacyFallback: boolean
}

export type AdditionalLineInput = {
  quantity: number
  unitPrice: number
  perPerson: boolean
}

export type CalculateQuoteTotalsInput = {
  guestCounts: GuestCounts
  packagePricePerPerson: number
  additionals?: AdditionalLineInput[]
  additionalTotalOverride?: number | null
  mileageDistance?: number
  mileageFreeLimit?: number
  mileageRate?: number
  mileageFeeOverride?: number | null
  reservationPercentage?: number
  reservationAmountOverride?: number | null
  useCustomReservation?: boolean
}

export type QuoteTotals = {
  billableAdults: number
  freeChildren: number
  halfPriceChildren: number
  /** Pessoas cobradas equivalentes (ex.: 40 adultos + 3 meias = 43) */
  billableGuests: number
  /** Total de convidados físicos no evento */
  physicalGuestTotal: number
  packageTotal: number
  additionalTotal: number
  mileageFee: number
  quoteSubtotal: number
  reservationAmount: number
  balanceDue: number
  quoteTotal: number
}

export type QuoteRecordForGuests = {
  adult_count?: number | null
  adults_count?: number | null
  children_under_3_count?: number | null
  children_4_to_12_count?: number | null
  children_count?: number | null
  billable_guest_count?: number | null
  billable_guests?: number | null
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function toNumber(value: number | null | undefined) {
  return Math.max(0, Number(value ?? 0))
}

export function calcMileageFee(
  distance: number,
  freeLimit: number = MILEAGE_FREE_LIMIT,
  rate: number = MILEAGE_RATE,
) {
  const billableMiles = Math.max(0, toNumber(distance) - toNumber(freeLimit))
  return roundMoney(billableMiles * toNumber(rate))
}

export function calcBillableGuests(guestCounts: GuestCounts) {
  const adultCount = toNumber(guestCounts.adultCount)
  const children4To12Count = toNumber(guestCounts.children4To12Count)
  return roundMoney(adultCount + children4To12Count * 0.5)
}

export function calcPhysicalGuestTotal(guestCounts: GuestCounts) {
  return (
    toNumber(guestCounts.adultCount) +
    toNumber(guestCounts.childrenUnder3Count) +
    toNumber(guestCounts.children4To12Count)
  )
}

export function calcAdditionalLineTotal(
  line: AdditionalLineInput,
  billableGuests: number,
) {
  const quantity = toNumber(line.quantity)
  if (quantity <= 0) return 0

  const unitPrice = toNumber(line.unitPrice)
  if (line.perPerson) {
    return roundMoney(unitPrice * billableGuests)
  }
  return roundMoney(unitPrice * quantity)
}

export function calculateQuoteTotals(
  input: CalculateQuoteTotalsInput,
): QuoteTotals {
  const guestCounts = {
    adultCount: toNumber(input.guestCounts.adultCount),
    childrenUnder3Count: toNumber(input.guestCounts.childrenUnder3Count),
    children4To12Count: toNumber(input.guestCounts.children4To12Count),
  }

  const billableAdults = guestCounts.adultCount
  const freeChildren = guestCounts.childrenUnder3Count
  const halfPriceChildren = guestCounts.children4To12Count * 0.5
  const billableGuests = calcBillableGuests(guestCounts)
  const physicalGuestTotal = calcPhysicalGuestTotal(guestCounts)

  const packagePricePerPerson = toNumber(input.packagePricePerPerson)
  const packageTotal = roundMoney(packagePricePerPerson * billableGuests)

  const additionalTotal =
    input.additionalTotalOverride != null
      ? roundMoney(toNumber(input.additionalTotalOverride))
      : roundMoney(
          (input.additionals ?? []).reduce(
            (sum, line) => sum + calcAdditionalLineTotal(line, billableGuests),
            0,
          ),
        )

  const mileageFee =
    input.mileageFeeOverride != null
      ? roundMoney(toNumber(input.mileageFeeOverride))
      : calcMileageFee(
          input.mileageDistance ?? 0,
          input.mileageFreeLimit ?? MILEAGE_FREE_LIMIT,
          input.mileageRate ?? MILEAGE_RATE,
        )

  const quoteSubtotal = roundMoney(packageTotal + additionalTotal + mileageFee)

  const reservationPercentage =
    input.reservationPercentage ?? RESERVATION_PERCENTAGE

  const reservationAmount = input.useCustomReservation
    ? roundMoney(toNumber(input.reservationAmountOverride))
    : roundMoney(quoteSubtotal * (reservationPercentage / 100))

  const balanceDue = roundMoney(quoteSubtotal - reservationAmount)

  return {
    billableAdults,
    freeChildren,
    halfPriceChildren,
    billableGuests,
    physicalGuestTotal,
    packageTotal,
    additionalTotal,
    mileageFee,
    quoteSubtotal,
    reservationAmount,
    balanceDue,
    quoteTotal: quoteSubtotal,
  }
}

export function resolveGuestCountsFromQuote(
  quote: QuoteRecordForGuests,
): QuoteGuestCounts {
  const hasSplitFields =
    quote.children_under_3_count != null ||
    quote.children_4_to_12_count != null

  const adultCount = toNumber(quote.adult_count ?? quote.adults_count)

  if (hasSplitFields) {
    return {
      adultCount,
      childrenUnder3Count: toNumber(quote.children_under_3_count),
      children4To12Count: toNumber(quote.children_4_to_12_count),
      source: 'supabase_split',
      usingLegacyFallback: false,
    }
  }

  const childrenCount = toNumber(quote.children_count)
  const billableFromDb = quote.billable_guest_count ?? quote.billable_guests

  if (billableFromDb != null) {
    const children4To12Count = Math.max(
      0,
      Math.round((toNumber(billableFromDb) - adultCount) * 2),
    )
    const childrenUnder3Count = Math.max(0, childrenCount - children4To12Count)

    return {
      adultCount,
      childrenUnder3Count,
      children4To12Count,
      source: 'supabase_legacy_fallback',
      usingLegacyFallback: true,
    }
  }

  return {
    adultCount,
    childrenUnder3Count: 0,
    children4To12Count: childrenCount,
    source: 'supabase_legacy_fallback',
    usingLegacyFallback: true,
  }
}

export function calculateQuoteTotalsFromQuoteRecord(
  quote: QuoteRecordForGuests & {
    package_price_per_person?: number | null
    package_unit_price?: number | null
    package_total?: number | null
    additional_total?: number | null
    mileage_distance?: number | null
    mileage_free_limit?: number | null
    mileage_rate?: number | null
    mileage_fee?: number | null
    reservation_amount?: number | null
    reservation_percentage?: number | null
    quote_total?: number | null
    balance_due?: number | null
    additional_items?: Array<{
      quantity?: number | null
      unit_price?: number | null
      total_price?: number | null
    }> | null
  },
) {
  const guestCounts = resolveGuestCountsFromQuote(quote)

  const additionalTotalFromItems = roundMoney(
    (quote.additional_items ?? []).reduce(
      (sum, item) => sum + toNumber(item.total_price),
      0,
    ),
  )

  const calculated = calculateQuoteTotals({
    guestCounts,
    packagePricePerPerson: toNumber(
      quote.package_price_per_person ?? quote.package_unit_price,
    ),
    additionalTotalOverride:
      quote.additional_total ?? additionalTotalFromItems,
    mileageDistance: quote.mileage_distance ?? 0,
    mileageFreeLimit: quote.mileage_free_limit ?? MILEAGE_FREE_LIMIT,
    mileageRate: quote.mileage_rate ?? MILEAGE_RATE,
    mileageFeeOverride: quote.mileage_fee,
    reservationPercentage:
      quote.reservation_percentage ?? RESERVATION_PERCENTAGE,
    reservationAmountOverride: quote.reservation_amount,
    useCustomReservation: quote.reservation_amount != null,
  })

  return {
    guestCounts,
    billableGuests: calculated.billableGuests,
    totals: calculated,
  }
}
