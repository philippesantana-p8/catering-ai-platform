import type { GuestCounts } from '@/Lib/calculateQuoteTotals'
import type { QuoteReviewPackageSummary } from './quoteReviewPackageSummary'

export type QuoteReviewAdditional = {
  id: string
  label: string
  category: string
  quantity: number | null
  unitPrice: number | null
  totalPrice: number | null
  imageUrl?: string | null
}

export type QuoteReviewData = {
  quoteNumber?: string
  quoteStatus?: string | null
  preview?: boolean
  customerName: string
  eventName: string
  eventDate: string | null
  startTime: string | null
  endTime: string | null
  addressLine: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  packageName: string | null
  packageImageUrl?: string | null
  packageUnitPrice: number | null
  packageTotal: number | null
  packageSummary?: QuoteReviewPackageSummary | null
  guestCounts: GuestCounts
  billableGuestCount: number | null
  physicalGuestCount: number | null
  hasGrill: boolean | null
  grillPhotoRequired: boolean | null
  grillPhotoStatusLabel?: string | null
  grillRentalRequired: boolean | null
  grillRentalQty: number | null
  grillNotes: string | null
  mileageBaseLocation: string | null
  mileageDistance: number | null
  mileageFreeLimit: number | null
  mileageRate: number | null
  mileageFee: number | null
  additionalTotal: number | null
  reservationPercentage: number | null
  reservationAmount: number | null
  balanceDue: number | null
  quoteTotal: number | null
  discount?: number
  additionals: QuoteReviewAdditional[]
}
