'use client'

import { useMemo } from 'react'
import type { PendingStepIssue, StepStatusContext } from '@/app/quotes/new/wizardStepStatus'
import type { QuoteTotals } from '@/Lib/calculateQuoteTotals'
import type { WizardState } from '@/Lib/quoteWizardTypes'
import type { CommercialRulesSnapshot } from '@/Lib/supabaseCommercialRules'
import QuoteReviewLayout from './QuoteReviewLayout'
import WizardCompletionProgress from './WizardCompletionProgress'
import WizardQuoteValidationPanel from './WizardQuoteValidationPanel'
import {
  mapWizardToQuoteReview,
  type WizardSelectedAdditional,
} from './mapWizardToQuoteReview'

export default function QuoteWizardSummaryStep({
  state,
  quoteTotals,
  customerName,
  packageName,
  packageDescription,
  packageUnitPrice,
  billableGuestCount,
  additionals,
  commercialRules,
  stepStatusCtx,
  mandatoryPendingSteps,
  quoteReady,
  saving,
  saveError,
  isEditMode,
  onGoToStep,
  onBack,
  onSave,
}: {
  state: WizardState
  quoteTotals: QuoteTotals
  customerName: string
  packageName: string | null
  packageDescription: string | null
  packageUnitPrice: number
  billableGuestCount: number
  additionals: WizardSelectedAdditional[]
  commercialRules: CommercialRulesSnapshot
  stepStatusCtx: StepStatusContext
  mandatoryPendingSteps: PendingStepIssue[]
  quoteReady: boolean
  saving: boolean
  saveError: string | null
  isEditMode: boolean
  onGoToStep: (stepIndex: number) => void
  onBack: () => void
  onSave: (openReview: boolean) => void
}) {
  const reviewData = useMemo(
    () =>
      mapWizardToQuoteReview({
        state,
        quoteTotals,
        customerName,
        packageName,
        packageDescription,
        packageUnitPrice,
        additionals,
        billableGuestCount,
        commercialRules,
      }),
    [
      state,
      quoteTotals,
      customerName,
      packageName,
      packageDescription,
      packageUnitPrice,
      additionals,
      billableGuestCount,
      commercialRules,
    ],
  )

  const saveDisabled = !quoteReady || saving

  return (
    <div className="space-y-8">
      <WizardCompletionProgress stepStatusCtx={stepStatusCtx} />

      <WizardQuoteValidationPanel
        pendingSteps={mandatoryPendingSteps}
        ready={quoteReady}
        onGoToStep={onGoToStep}
      />

      <div className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-bg shadow-cdl">
        <QuoteReviewLayout data={reviewData} rulesVariant="summary" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {saveError ? (
          <p className="text-sm text-red-400 sm:mr-auto">{saveError}</p>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-cdl-border bg-cdl-surface px-6 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => onSave(false)}
          disabled={saveDisabled}
          className="cdl-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? 'Salvando…'
            : isEditMode
              ? 'Salvar alterações'
              : 'Criar cotação'}
        </button>
        <button
          type="button"
          onClick={() => onSave(true)}
          disabled={saveDisabled}
          className="rounded-xl border border-cdl-accent-border bg-cdl-surface px-6 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:bg-cdl-muted-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? 'Salvando…'
            : isEditMode
              ? 'Salvar e abrir revisão'
              : 'Criar cotação e abrir revisão'}
        </button>
      </div>
    </div>
  )
}
