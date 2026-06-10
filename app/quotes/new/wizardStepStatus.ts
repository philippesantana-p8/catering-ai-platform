import {
  getPackageOptionGroupsForPackage,
  isCustomPackage,
  validatePackageSelections,
  type PackageOptionGroup,
} from '@/Lib/packageOptionGroups'
import {
  getFallbackCommercialRules,
  type CommercialRulesSnapshot,
} from '@/Lib/supabaseCommercialRules'
import type { GrillPhotoStatus } from '@/Lib/grillPhotoStatus'
import { isUsablePhone } from '@/Lib/normalizePhone'

export const WIZARD_STEP_LABELS = [
  'Cliente',
  'Evento',
  'Pacote',
  'Adicionais',
  'Churrasqueira',
  'Milhagem',
  'Reserva',
  'Resumo',
] as const

export const STEPS_COUNT = WIZARD_STEP_LABELS.length

/** Verde = concluído · Amarelo = pendente · Vermelho = erro (resumo) */
export type StepVisualStatus = 'complete' | 'pending' | 'error'

export type WizardStateSnapshot = {
  customerId: string | null
  customerDraftPhone: string
  eventName: string
  eventDate: string
  startTime: string
  endTime: string
  address: string
  city: string
  state: string
  zipCode: string
  adultCount: number
  childrenUnder3Count: number
  children4To12Count: number
  hasGrill: boolean
  grillSetupAnswered: boolean
  grillPhotoRequired: boolean
  grillPhotoStatus: GrillPhotoStatus
  grillPhotoAnswered: boolean
  grillRentalRequired: boolean
  grillRentalQty: number
  grillNotes: string
  packageId: string | null
  packageSelections: Record<string, string>
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
  selectedPackage: { id: string; package_key?: string | null } | null
  currentStep: number
  reservationAmount: number
  additionalsCount: number
  packageOptionGroups?: ReadonlyArray<
    import('@/Lib/packageOptionGroups').PackageOptionGroupRecord
  >
  packageOptionGroupItems?: ReadonlyArray<
    import('@/Lib/packageOptionGroups').PackageOptionGroupItem
  >
  commercialRules?: CommercialRulesSnapshot
  isEditMode?: boolean
}

export type PendingStepIssue = {
  stepIndex: number
  label: string
  issues: string[]
}

/** Etapas obrigatórias (Cliente e Adicionais = opcionais). */
const MANDATORY_STEP_INDICES = [1, 2, 4, 5, 6] as const

function isFilled(value: string) {
  return value.trim().length > 0
}

function isReservationPercentageValid(
  value: number,
  expected: number,
) {
  return Math.abs(value - expected) < 0.001
}

function hasLinkedCustomer(ctx: StepStatusContext): boolean {
  if (ctx.isEditMode) return Boolean(ctx.state.customerId)
  if (ctx.selectedCustomer || ctx.state.customerId) return true
  return isUsablePhone(ctx.state.customerDraftPhone)
}

export const GRILL_PHOTO_PENDING_WARNING =
  'Foto da churrasqueira pendente. Pode ser confirmada posteriormente.'

export function isGrillPhotoOperationallyPending(
  state: WizardStateSnapshot,
): boolean {
  if (!state.hasGrill) return false
  if (state.grillPhotoStatus === 'received') return false
  return state.grillPhotoStatus === 'pending' || state.grillPhotoRequired
}

export function getOperationalStepWarnings(
  ctx: StepStatusContext,
): PendingStepIssue[] {
  const warnings: PendingStepIssue[] = []

  if (isGrillPhotoOperationallyPending(ctx.state)) {
    warnings.push({
      stepIndex: 4,
      label: 'Churrasqueira',
      issues: [GRILL_PHOTO_PENDING_WARNING],
    })
  }

  return warnings
}

export function getOptionalStepWarnings(
  ctx: StepStatusContext,
): PendingStepIssue[] {
  const warnings = getOperationalStepWarnings(ctx)

  if (!ctx.isEditMode && !hasLinkedCustomer(ctx)) {
    warnings.push({
      stepIndex: 0,
      label: 'Cliente',
      issues: [
        'Cliente ainda não vinculado. A cotação pode ser criada, mas deverá ser revisada antes do envio final.',
      ],
    })
  }

  return warnings
}

function hasValidPackage(ctx: StepStatusContext): boolean {
  if (ctx.selectedPackage) return true
  return Boolean(ctx.state.packageId?.trim())
}

export function getStepIssues(
  stepIndex: number,
  ctx: StepStatusContext,
): string[] {
  const { state, selectedCustomer, selectedPackage, reservationAmount } = ctx
  const rules = ctx.commercialRules ?? getFallbackCommercialRules()
  const issues: string[] = []

  switch (stepIndex) {
    case 0:
      break
    case 1:
      if (!isFilled(state.eventName)) issues.push('Informe o nome do evento.')
      if (!isFilled(state.eventDate)) issues.push('Informe a data do evento.')
      if (!isFilled(state.startTime)) issues.push('Informe o horário de início.')
      if (!isFilled(state.endTime)) issues.push('Informe o horário de término.')
      if (!isFilled(state.address)) issues.push('Informe o endereço.')
      if (!isFilled(state.city)) issues.push('Informe a cidade.')
      if (!isFilled(state.state)) issues.push('Informe o estado.')
      if (!isFilled(state.zipCode)) issues.push('Informe o CEP / zip code.')
      if (!(state.adultCount > 0)) {
        issues.push('Informe o número de adultos (mínimo 1).')
      }
      break
    case 2: {
      if (!hasValidPackage(ctx)) {
        issues.push('Selecione um pacote.')
        break
      }
      const packageId = ctx.state.packageId?.trim()
      if (
        packageId &&
        ctx.selectedPackage &&
        !isCustomPackage(ctx.selectedPackage) &&
        ctx.packageOptionGroups
      ) {
        const groups = getPackageOptionGroupsForPackage(
          packageId,
          ctx.packageOptionGroups,
          ctx.packageOptionGroupItems,
        )
        issues.push(
          ...validatePackageSelections(groups, ctx.state.packageSelections),
        )
      }
      break
    }
    case 3:
      if (ctx.additionalsCount === 0) {
        issues.push('Nenhum adicional selecionado (opcional).')
      }
      break
    case 4:
      if (!state.grillSetupAnswered) {
        issues.push('Informe se o cliente possui churrasqueira.')
      }
      if (state.grillRentalRequired && state.grillRentalQty <= 0) {
        issues.push('Informe a quantidade de churrasqueiras para aluguel.')
      }
      break
    case 5:
      if (state.baseLocation.trim() !== rules.mileageBaseLocation) {
        issues.push(`Base deve ser ${rules.mileageBaseLocation}.`)
      }
      if (!(state.distance > 0)) issues.push('Informe a distância (mi).')
      if (state.freeLimit !== rules.mileageFreeLimit) {
        issues.push(`Limite gratuito deve ser ${rules.mileageFreeLimit} mi.`)
      }
      if (state.rate !== rules.mileageRate) {
        issues.push(`Taxa deve ser $${rules.mileageRate}/mi.`)
      }
      break
    case 6:
      if (
        !isReservationPercentageValid(
          state.reservationPercentage,
          rules.reservationPercentage,
        )
      ) {
        issues.push(`Reserva deve ser ${rules.reservationPercentage}%.`)
      }
      if (!(reservationAmount > 0)) {
        issues.push('Calcule o valor da reserva.')
      }
      break
    case 7:
      if (!areMandatoryStepsComplete(ctx)) {
        issues.push('Existem etapas obrigatórias incompletas.')
      }
      break
    default:
      break
  }

  return issues
}

export function isMandatoryStepComplete(
  stepIndex: number,
  ctx: StepStatusContext,
): boolean {
  return getStepIssues(stepIndex, ctx).length === 0
}

export function areMandatoryStepsComplete(ctx: StepStatusContext): boolean {
  return MANDATORY_STEP_INDICES.every((stepIndex) =>
    isMandatoryStepComplete(stepIndex, ctx),
  )
}

export function getMandatoryPendingSteps(
  ctx: StepStatusContext,
): PendingStepIssue[] {
  return MANDATORY_STEP_INDICES.filter(
    (stepIndex) => !isMandatoryStepComplete(stepIndex, ctx),
  ).map((stepIndex) => ({
    stepIndex,
    label: WIZARD_STEP_LABELS[stepIndex],
    issues: getStepIssues(stepIndex, ctx),
  }))
}

export function getStepVisualStatus(
  stepIndex: number,
  ctx: StepStatusContext,
): StepVisualStatus {
  if (stepIndex === 7) {
    return areMandatoryStepsComplete(ctx) ? 'complete' : 'error'
  }

  if (stepIndex === 0) {
    return hasLinkedCustomer(ctx) ? 'complete' : 'pending'
  }

  if (stepIndex === 3) {
    return ctx.additionalsCount > 0 ? 'complete' : 'pending'
  }

  if (stepIndex === 4) {
    if (!isMandatoryStepComplete(stepIndex, ctx)) return 'pending'
    if (isGrillPhotoOperationallyPending(ctx.state)) return 'pending'
    return 'complete'
  }

  return isMandatoryStepComplete(stepIndex, ctx) ? 'complete' : 'pending'
}

/** @deprecated Use getStepVisualStatus */
export type StepStatus = 'current' | 'complete' | 'incomplete' | 'empty'

/** @deprecated Use getStepVisualStatus */
export function getStepStatus(
  stepNumber: number,
  ctx: StepStatusContext,
): StepStatus {
  const stepIndex = stepNumber - 1
  const visual = getStepVisualStatus(stepIndex, ctx)

  if (stepIndex === ctx.currentStep) return 'current'
  if (visual === 'complete') return 'complete'
  if (visual === 'error' || visual === 'pending') return 'incomplete'
  return 'empty'
}

/** @deprecated Use isMandatoryStepComplete */
export function isStepComplete(stepIndex: number, ctx: StepStatusContext): boolean {
  if (stepIndex === 3) return ctx.additionalsCount > 0
  if (stepIndex === 7) return areMandatoryStepsComplete(ctx)
  return isMandatoryStepComplete(stepIndex, ctx)
}

export function countVisuallyCompleteSteps(ctx: StepStatusContext) {
  let count = 0
  for (let i = 0; i < STEPS_COUNT; i += 1) {
    if (getStepVisualStatus(i, ctx) === 'complete') count += 1
  }
  return count
}

export function countMandatoryPendingSteps(ctx: StepStatusContext) {
  return getMandatoryPendingSteps(ctx).length
}

export function countCompletedSteps(ctx: StepStatusContext) {
  return countVisuallyCompleteSteps(ctx)
}

export function countRemainingSteps(ctx: StepStatusContext) {
  return STEPS_COUNT - countVisuallyCompleteSteps(ctx)
}

export function getCompletionPercentage(ctx: StepStatusContext) {
  return Math.round((countVisuallyCompleteSteps(ctx) / STEPS_COUNT) * 100)
}

export function isQuoteReadyToSave(ctx: StepStatusContext) {
  return areMandatoryStepsComplete(ctx)
}
