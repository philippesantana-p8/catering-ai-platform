'use client'

import type { PendingStepIssue } from '@/app/quotes/new/wizardStepStatus'

export default function WizardQuoteValidationPanel({
  pendingSteps,
  ready,
  onGoToStep,
}: {
  pendingSteps: PendingStepIssue[]
  ready: boolean
  onGoToStep: (stepIndex: number) => void
}) {
  return (
    <section
      className={`rounded-2xl border p-7 shadow-cdl sm:p-9 ${
        ready
          ? 'border-cdl-success-border bg-cdl-success-soft'
          : 'border-cdl-action bg-cdl-red-soft'
      }`}
    >
      <h2
        className={`text-xl font-bold sm:text-2xl ${
          ready ? 'text-cdl-success' : 'text-cdl-action'
        }`}
      >
        Pendências da cotação
      </h2>

      {ready ? (
        <p className="mt-4 text-sm font-semibold text-cdl-success sm:text-base">
          Cotação pronta para salvar e gerar PDF.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {pendingSteps.map((pending) => (
            <li
              key={pending.stepIndex}
              className="rounded-xl border border-cdl-action/40 bg-cdl-surface p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-cdl-action">
                    {pending.label}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-cdl-text-secondary">
                    {pending.issues.map((issue) => (
                      <li key={issue} className="flex gap-2">
                        <span className="text-cdl-action" aria-hidden>
                          •
                        </span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onGoToStep(pending.stepIndex)}
                  className="shrink-0 rounded-xl border border-cdl-action bg-cdl-red-soft px-4 py-2 text-xs font-bold uppercase tracking-wider text-cdl-action transition-colors hover:bg-cdl-action hover:text-white"
                >
                  Ir para etapa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
