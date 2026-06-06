import {
  MILEAGE_FREE_LIMIT,
  MILEAGE_RATE,
  RESERVATION_PERCENTAGE,
} from './cdlCommercialRules'
import {
  buildOfficialGuestPayload,
  calcBillableGuestCount,
  calcPhysicalGuestCount,
  readOfficialGuestCountsFromQuote,
  type GuestCounts,
  type QuoteOfficialGuestRecord,
} from './quoteGuestFields'

export type { GuestCounts }

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
  /** adult_count + (children_4_to_12_count × 0.5) */
  billableGuestCount: number
  /** adult_count + children_under_3_count + children_4_to_12_count */
  physicalGuestCount: number
  packageTotal: number
  additionalTotal: number
  mileageFee: number
  quoteSubtotal: number
  reservationAmount: number
  balanceDue: number
  quoteTotal: number
}

export type QuoteRecordForGuests = QuoteOfficialGuestRecord

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

export function calcAdditionalLineTotal(
  line: AdditionalLineInput,
  billableGuestCount: number,
) {
  const quantity = toNumber(line.quantity)
  if (quantity <= 0) return 0

  const unitPrice = toNumber(line.unitPrice)
  if (line.perPerson) {
    return roundMoney(unitPrice * billableGuestCount)
  }
  return roundMoney(unitPrice * quantity)
}

export function calculateQuoteTotals(
  input: CalculateQuoteTotalsInput,
): QuoteTotals {
  const guestCounts: GuestCounts = {
    adultCount: toNumber(input.guestCounts.adultCount),
    childrenUnder3Count: toNumber(input.guestCounts.childrenUnder3Count),
    children4To12Count: toNumber(input.guestCounts.children4To12Count),
  }

  const billableAdults = guestCounts.adultCount
  const freeChildren = guestCounts.childrenUnder3Count
  const halfPriceChildren = guestCounts.children4To12Count * 0.5
  const billableGuestCount = calcBillableGuestCount(guestCounts)
  const physicalGuestCount = calcPhysicalGuestCount(guestCounts)

  const packagePricePerPerson = toNumber(input.packagePricePerPerson)
  const packageTotal = roundMoney(packagePricePerPerson * billableGuestCount)

  const additionalTotal =
    input.additionalTotalOverride != null
      ? roundMoney(toNumber(input.additionalTotalOverride))
      : roundMoney(
          (input.additionals ?? []).reduce(
            (sum, line) =>
              sum + calcAdditionalLineTotal(line, billableGuestCount),
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
    billableGuestCount,
    physicalGuestCount,
    packageTotal,
    additionalTotal,
    mileageFee,
    quoteSubtotal,
    reservationAmount,
    balanceDue,
    quoteTotal: quoteSubtotal,
  }
}

export function calculateQuoteTotalsFromQuoteRecord(
  quote: QuoteRecordForGuests & {
    id?: string
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
  const guestCounts = readOfficialGuestCountsFromQuote(
    quote,
    quote.id ? `quote:${quote.id}` : 'quote',
  )

  const additionalTotalFromItems = roundMoney(
    (quote.additional_items ?? []).reduce(
      (sum, item) => sum + toNumber(item.total_price),
      0,
    ),
  )

  const totals = calculateQuoteTotals({
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
    officialGuestPayload: buildOfficialGuestPayload(guestCounts),
    billableGuestCount: totals.billableGuestCount,
    totals,
  }
}

export {
  buildOfficialGuestPayload,
  calcBillableGuestCount,
  calcPhysicalGuestCount,
  readOfficialGuestCountsFromQuote,
}
