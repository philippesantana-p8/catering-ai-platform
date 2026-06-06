import { WIZARD_STEP_LABELS } from '@/app/quotes/new/wizardStepStatus'

export const WIZARD_STEP_SLUGS: Record<string, number> = {
  cliente: 0,
  evento: 1,
  pacote: 2,
  adicionais: 3,
  churrasqueira: 4,
  milhagem: 5,
  reserva: 6,
  resumo: 7,
}

export const EDIT_WIZARD_DEFAULT_STEP = 4

export function resolveWizardStep(
  stepParam?: string | null,
  fallbackStep = 0,
): number {
  if (!stepParam?.trim()) return fallbackStep

  const normalized = stepParam.trim().toLowerCase()
  const bySlug = WIZARD_STEP_SLUGS[normalized]
  if (bySlug != null) return bySlug

  const numeric = Number.parseInt(normalized, 10)
  if (
    Number.isFinite(numeric) &&
    numeric >= 0 &&
    numeric < WIZARD_STEP_LABELS.length
  ) {
    return numeric
  }

  return fallbackStep
}
