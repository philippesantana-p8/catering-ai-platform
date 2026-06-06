export type StepStatus = 'current' | 'complete' | 'incomplete' | 'empty'

const STEPS_COUNT = 8

export type WizardStateSnapshot = {
  customerId: string | null
  eventName: string
  eventDate: string
  startTime: string
  endTime: string
  city: string
  state: string
  address: string
  adultsQty: number
  childrenQty: number
  hasGrill: boolean
  grillSetupAnswered: boolean
  grillPhotoRequired: boolean
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
  reservationNotes: string
}

export type StepStatusContext = {
  state: WizardStateSnapshot
  selectedCustomer: { id: string } | null
  selectedPackage: { id: string } | null
  currentStep: number
  reservationAmount: number
  additionalsCount: number
}

function isFilled(value: string) {
  return value.trim().length > 0
}

export function isStepComplete(stepIndex: number, ctx: StepStatusContext): boolean {
  const { state, selectedCustomer, selectedPackage, reservationAmount, additionalsCount } =
    ctx

  switch (stepIndex) {
    case 0:
      return selectedCustomer !== null
    case 1:
      return (
        isFilled(state.eventName) &&
        isFilled(state.eventDate) &&
        isFilled(state.startTime) &&
        isFilled(state.endTime) &&
        isFilled(state.city) &&
        isFilled(state.state)
      )
    case 2: {
      if (!state.grillSetupAnswered) return false
      const grillOk = !state.hasGrill || state.grillPhotoRequired
      const rentalOk = !state.grillRentalRequired || state.grillRentalQty > 0
      return grillOk && rentalOk
    }
    case 3:
      return selectedPackage !== null
    case 4:
      return additionalsCount > 0
    case 5:
      return state.distance > 0
    case 6:
      return reservationAmount > 0
    case 7: {
      for (let i = 0; i < 7; i += 1) {
        if (!isStepComplete(i, ctx)) return false
      }
      return true
    }
    default:
      return false
  }
}

export function isStepStarted(stepIndex: number, ctx: StepStatusContext): boolean {
  const { state, additionalsCount, reservationAmount } = ctx

  switch (stepIndex) {
    case 0:
    case 1:
    case 3:
      return true
    case 2:
      return true
    case 4:
      return additionalsCount > 0
    case 5:
      return (
        state.distance > 0 ||
        isFilled(state.baseLocation) ||
        state.freeLimit > 0 ||
        state.rate > 0
      )
    case 6:
      return (
        reservationAmount > 0 ||
        isFilled(state.reservationNotes) ||
        state.reservationPercentage !== 20
      )
    case 7:
      return ctx.currentStep === 7
    default:
      return false
  }
}

export function getStepStatus(
  stepNumber: number,
  ctx: StepStatusContext,
): StepStatus {
  const stepIndex = stepNumber - 1

  if (stepIndex === ctx.currentStep) return 'current'
  if (isStepComplete(stepIndex, ctx)) return 'complete'
  if (isStepStarted(stepIndex, ctx)) return 'incomplete'
  return 'empty'
}

export function countCompletedSteps(ctx: StepStatusContext) {
  return STEPS_COUNT - countRemainingSteps(ctx)
}

export function countRemainingSteps(ctx: StepStatusContext) {
  let remaining = 0
  for (let i = 0; i < STEPS_COUNT; i += 1) {
    if (!isStepComplete(i, ctx)) remaining += 1
  }
  return remaining
}

export function getCompletionPercentage(ctx: StepStatusContext) {
  const completed = countCompletedSteps(ctx)
  return Math.round((completed / STEPS_COUNT) * 100)
}
