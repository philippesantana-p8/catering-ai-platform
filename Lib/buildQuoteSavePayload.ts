import { calculateQuoteTotals } from './calculateQuoteTotals'
import { buildOfficialGuestPayload } from './quoteGuestFields'

export type QuoteAdditionalSaveLine = {
  itemId: string
  quantity: number
  unitPrice: number
  perPerson: boolean
  totalPrice: number
}

export type QuoteSaveInput = {
  customerId: string
  packageId: string
  eventName: string
  eventDate: string
  startTime: string
  endTime: string
  adultCount: number
  childrenUnder3Count: number
  children4To12Count: number
  address: string
  city: string
  state: string
  zipCode: string
  hasGrill: boolean
  grillPhotoRequired: boolean
  grillRentalRequired: boolean
  grillRentalQty: number
  grillNotes: string
  baseLocation: string
  distance: number
  freeLimit: number
  rate: number
  reservationPercentage: number
  reservationAmount: number
  packagePricePerPerson: number
  additionals: QuoteAdditionalSaveLine[]
}

export function buildQuoteSavePayload(input: QuoteSaveInput) {
  const guestCounts = {
    adultCount: input.adultCount,
    childrenUnder3Count: input.childrenUnder3Count,
    children4To12Count: input.children4To12Count,
  }

  const officialGuests = buildOfficialGuestPayload(guestCounts)

  const totals = calculateQuoteTotals({
    guestCounts,
    packagePricePerPerson: input.packagePricePerPerson,
    additionals: input.additionals.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      perPerson: line.perPerson,
    })),
    mileageDistance: input.distance,
    mileageFreeLimit: input.freeLimit,
    mileageRate: input.rate,
    reservationPercentage: input.reservationPercentage,
    reservationAmountOverride: input.reservationAmount,
    useCustomReservation: false,
  })

  return {
    customer_id: input.customerId,
    package_id: input.packageId,
    event_name: input.eventName,
    event_date: input.eventDate,
    start_time: input.startTime,
    end_time: input.endTime,
    address_line: input.address,
    city: input.city,
    state: input.state,
    zip_code: input.zipCode,
    has_grill: input.hasGrill,
    grill_photo_required: input.grillPhotoRequired,
    grill_rental_required: input.grillRentalRequired,
    grill_rental_qty: input.grillRentalRequired ? input.grillRentalQty : 0,
    grill_notes: input.grillNotes.trim() || null,
    mileage_base_location: input.baseLocation,
    mileage_distance: input.distance,
    mileage_free_limit: input.freeLimit,
    mileage_rate: input.rate,
    mileage_fee: totals.mileageFee,
    package_total: totals.packageTotal,
    additional_total: totals.additionalTotal,
    reservation_amount: totals.reservationAmount,
    reservation_percentage: input.reservationPercentage,
    balance_due: totals.balanceDue,
    quote_total: totals.quoteTotal,
    quote_status: 'draft',
    ...officialGuests,
  }
}

export type QuoteSavePayload = ReturnType<typeof buildQuoteSavePayload>
