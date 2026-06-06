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
  saveErrorDetail,
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
  saveErrorDetail: string | null
  isEditMode: boolean
  onGoToStep: (stepIndex: number) => void
  onBack: () => void
  onSave: (openReview: boolean) => void | Promise<void>
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

  const hasMandatoryPending = mandatoryPendingSteps.length > 0
  const saveDisabled = saving || hasMandatoryPending
  const savingLabel = isEditMode ? 'Salvando…' : 'Criando cotação...'

  return (
    <div className="space-y-8">
      <WizardCompletionProgress stepStatusCtx={stepStatusCtx} />

      <WizardQuoteValidationPanel
        pendingSteps={mandatoryPendingSteps}
        ready={quoteReady}
        onGoToStep={onGoToStep}
      />

      {saveError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3"
        >
          <p className="text-sm font-semibold text-red-300">{saveError}</p>
          {saveErrorDetail ? (
            <p className="mt-1 font-mono text-xs text-red-400/80">
              {saveErrorDetail}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-bg shadow-cdl">
        <QuoteReviewLayout data={reviewData} rulesVariant="summary" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-xl border border-cdl-border bg-cdl-surface px-6 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:border-cdl-accent-border disabled:cursor-not-allowed disabled:opacity-40"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => void onSave(false)}
          disabled={saveDisabled}
          className="cdl-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? savingLabel
            : isEditMode
              ? 'Salvar alterações'
              : 'Criar cotação'}
        </button>
        <button
          type="button"
          onClick={() => void onSave(true)}
          disabled={saveDisabled}
          className="rounded-xl border border-cdl-accent-border bg-cdl-surface px-6 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg transition-colors hover:bg-cdl-muted-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? savingLabel
            : isEditMode
              ? 'Salvar e abrir revisão'
              : 'Criar cotação e abrir revisão'}
        </button>
      </div>
    </div>
  )
}
