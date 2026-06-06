import type { CommercialRulesSnapshot } from './supabaseCommercialRules'

import type { GrillPhotoStatus } from './grillPhotoStatus'

export type WizardState = {
  customerId: string | null
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
  grillSetupAnswered: boolean
  grillPhotoRequired: boolean
  grillPhotoStatus: GrillPhotoStatus
  grillPhotoAnswered: boolean
  grillPhotoUrl: string | null
  grillRentalRequired: boolean
  grillRentalQty: number
  grillNotes: string
  packageId: string | null
  additionals: Record<string, number>
  baseLocation: string
  distance: number
  freeLimit: number
  rate: number
  reservationPercentage: number
  reservationAmount: number
  reservationNotes: string
}

export function createInitialWizardState(
  rules: CommercialRulesSnapshot,
): WizardState {
  return {
    customerId: null,
    eventName: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    adultCount: 0,
    childrenUnder3Count: 0,
    children4To12Count: 0,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    hasGrill: false,
    grillSetupAnswered: false,
    grillPhotoRequired: false,
    grillPhotoStatus: 'not_applicable',
    grillPhotoAnswered: false,
    grillPhotoUrl: null,
    grillRentalRequired: false,
    grillRentalQty: 0,
    grillNotes: '',
    packageId: null,
    additionals: {},
    baseLocation: rules.mileageBaseLocation,
    distance: 0,
    freeLimit: rules.mileageFreeLimit,
    rate: rules.mileageRate,
    reservationPercentage: rules.reservationPercentage,
    reservationAmount: 0,
    reservationNotes: '',
  }
}

export function buildPricingFingerprint(state: WizardState): string {
  const additionals = Object.entries(state.additionals)
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b))

  return JSON.stringify({
    packageId: state.packageId,
    adultCount: state.adultCount,
    childrenUnder3Count: state.childrenUnder3Count,
    children4To12Count: state.children4To12Count,
    distance: state.distance,
    baseLocation: state.baseLocation.trim(),
    additionals,
  })
}
