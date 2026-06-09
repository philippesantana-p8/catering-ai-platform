import type { QuoteTotals } from '@/Lib/calculateQuoteTotals'
import type { WizardState } from '@/Lib/quoteWizardTypes'
import type { CommercialRulesSnapshot } from '@/Lib/supabaseCommercialRules'
import { getGrillPhotoStatusLabel } from '@/Lib/grillPhotoStatus'
import type { QuoteReviewAdditional, QuoteReviewData } from './quoteReviewTypes'

export type WizardSelectedAdditional = {
  id: string
  label: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl?: string | null
  perPerson?: boolean
}

export type MapWizardToQuoteReviewInput = {
  state: WizardState
  quoteTotals: QuoteTotals
  customerName: string
  packageName: string | null
  packageImageUrl: string | null
  packageUnitPrice: number
  additionals: WizardSelectedAdditional[]
  billableGuestCount: number
  commercialRules: CommercialRulesSnapshot
}

export function mapWizardToQuoteReview(
  input: MapWizardToQuoteReviewInput,
): QuoteReviewData {
  const { state, quoteTotals, commercialRules } = input

  const reviewAdditionals: QuoteReviewAdditional[] = input.additionals.map(
    (item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      quantity: item.perPerson ? input.billableGuestCount : item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      imageUrl: item.imageUrl,
    }),
  )

  return {
    preview: true,
    customerName: input.customerName,
    eventName: state.eventName.trim() || input.customerName,
    eventDate: state.eventDate || null,
    startTime: state.startTime || null,
    endTime: state.endTime || null,
    addressLine: state.address || null,
    city: state.city || null,
    state: state.state || null,
    zipCode: state.zipCode || null,
    packageName: input.packageName,
    packageImageUrl: input.packageImageUrl?.trim() || null,
    packageUnitPrice: input.packageUnitPrice,
    packageTotal: quoteTotals.packageTotal,
    guestCounts: {
      adultCount: state.adultCount,
      childrenUnder3Count: state.childrenUnder3Count,
      children4To12Count: state.children4To12Count,
    },
    billableGuestCount: quoteTotals.billableGuestCount,
    physicalGuestCount: quoteTotals.physicalGuestCount,
    hasGrill: state.grillSetupAnswered ? state.hasGrill : null,
    grillPhotoRequired: state.grillPhotoRequired,
    grillPhotoStatusLabel: state.hasGrill
      ? getGrillPhotoStatusLabel(state.grillPhotoStatus)
      : 'Não se aplica',
    grillRentalRequired: state.grillRentalRequired,
    grillRentalQty: state.grillRentalRequired ? state.grillRentalQty : null,
    grillNotes: state.grillNotes.trim() || null,
    mileageBaseLocation:
      state.baseLocation.trim() || commercialRules.mileageBaseLocation,
    mileageDistance: state.distance,
    mileageFreeLimit: state.freeLimit ?? commercialRules.mileageFreeLimit,
    mileageRate: state.rate ?? commercialRules.mileageRate,
    mileageFee: quoteTotals.mileageFee,
    additionalTotal: quoteTotals.additionalTotal,
    reservationPercentage: state.reservationPercentage,
    reservationAmount: quoteTotals.reservationAmount,
    balanceDue: quoteTotals.balanceDue,
    quoteTotal: quoteTotals.quoteTotal,
    additionals: reviewAdditionals,
  }
}
