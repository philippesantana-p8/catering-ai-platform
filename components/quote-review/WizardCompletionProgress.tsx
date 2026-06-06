'use client'

import {
  countCompletedSteps,
  countMandatoryPendingSteps,
  getCompletionPercentage,
  getStepVisualStatus,
  isQuoteReadyToSave,
  WIZARD_STEP_LABELS,
  type StepStatusContext,
  type StepVisualStatus,
} from '@/app/quotes/new/wizardStepStatus'

function stepSegmentClass(status: StepVisualStatus) {
  switch (status) {
    case 'complete':
      return 'bg-cdl-success'
    case 'pending':
      return 'bg-cdl-warning'
    case 'error':
      return 'bg-cdl-action'
    default:
      return 'bg-cdl-border'
  }
}

export default function WizardCompletionProgress({
  stepStatusCtx,
}: {
  stepStatusCtx: StepStatusContext
}) {
  const completedSteps = countCompletedSteps(stepStatusCtx)
  const percentage = getCompletionPercentage(stepStatusCtx)
  const ready = isQuoteReadyToSave(stepStatusCtx)

  return (
    <section className="rounded-2xl border border-cdl-border bg-cdl-surface p-7 shadow-cdl sm:p-9">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="cdl-eyebrow">Progresso da cotação</p>
          <p className="mt-2 text-2xl font-bold text-cdl-fg sm:text-3xl">
            {completedSteps} de {WIZARD_STEP_LABELS.length} etapas concluídas
          </p>
          <p className="mt-1 text-sm text-cdl-text-secondary">
            {percentage}% de conclusão
          </p>
        </div>
        <div
          className={`rounded-xl border px-5 py-4 text-center sm:min-w-[16rem] ${
            ready
              ? 'border-cdl-success-border bg-cdl-success-soft'
              : 'border-cdl-warning-border bg-cdl-warning-soft'
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wider ${
              ready ? 'text-cdl-success' : 'text-cdl-warning'
            }`}
          >
            {ready
              ? 'Pronto para gerar cotação'
              : `Faltam ${countMandatoryPendingSteps(stepStatusCtx)} etapas obrigatórias`}
          </p>
        </div>
      </div>
      <div className="mt-5 flex h-1.5 gap-1 overflow-hidden rounded-full">
        {WIZARD_STEP_LABELS.map((label, index) => (
          <div
            key={label}
            className={`flex-1 rounded-full transition-colors ${stepSegmentClass(getStepVisualStatus(index, stepStatusCtx))}`}
            title={label}
          />
        ))}
      </div>
    </section>
  )
}
