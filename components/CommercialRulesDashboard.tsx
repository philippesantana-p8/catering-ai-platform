'use client'

import { useCallback, useEffect, useState } from 'react'
import AppMainNav from '@/components/AppMainNav'
import type { CommercialRulesSnapshot } from '@/Lib/supabaseCommercialRules'

type TextRules = {
  reservationPayment: string
  cancellation: string[]
  minimumOrder: string[]
  mileage: string[]
  reservation: string[]
  foodPolicy: string[]
  latePayment: string[]
  decemberJanuary: string[]
  quoteValidityDays: number
}

type RulesApiResponse = {
  rules: CommercialRulesSnapshot
  editable: boolean
  table: string | null
  textRules: TextRules
  fallback: CommercialRulesSnapshot
}

const NUMERIC_FIELDS: Array<{
  key: keyof CommercialRulesSnapshot
  label: string
  step?: string
}> = [
  { key: 'reservationPercentage', label: 'Reserva (%)', step: '1' },
  { key: 'mileageFreeLimit', label: 'Milhas gratuitas', step: '1' },
  { key: 'mileageRate', label: 'Taxa por milha ($)', step: '0.01' },
  { key: 'sidesPricePerPerson', label: 'Guarnições ($/pessoa)', step: '0.01' },
  { key: 'minOrderWeekday', label: 'Pedido mín. seg–qui ($)', step: '1' },
  { key: 'minOrderWeekend', label: 'Pedido mín. sex–dom ($)', step: '1' },
  { key: 'minOrderDecJan', label: 'Pedido mín. dez/jan ($)', step: '1' },
  { key: 'holidaySurchargePercent', label: 'Acréscimo feriado (%)', step: '1' },
  { key: 'holidayMinOrder', label: 'Mínimo feriado ($)', step: '1' },
  { key: 'childFreeAgeMax', label: 'Criança grátis até (anos)', step: '1' },
  { key: 'childHalfAgeMax', label: 'Meia até (anos)', step: '1' },
]

function snapshotToPatchBody(rules: CommercialRulesSnapshot) {
  return {
    mileage_base_location: rules.mileageBaseLocation,
    mileage_free_limit: rules.mileageFreeLimit,
    mileage_rate: rules.mileageRate,
    reservation_percentage: rules.reservationPercentage,
    sides_price_per_person: rules.sidesPricePerPerson,
    min_order_weekday: rules.minOrderWeekday,
    min_order_weekend: rules.minOrderWeekend,
    min_order_dec_jan: rules.minOrderDecJan,
    holiday_surcharge_percent: rules.holidaySurchargePercent,
    holiday_min_order: rules.holidayMinOrder,
    child_free_age_max: rules.childFreeAgeMax,
    child_half_age_max: rules.childHalfAgeMax,
  }
}

export default function CommercialRulesDashboard({
  initialData,
}: {
  initialData: RulesApiResponse
}) {
  const [data, setData] = useState<RulesApiResponse>(initialData)
  const [draft, setDraft] = useState<CommercialRulesSnapshot>(initialData.rules)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/commercial-rules?_=${Date.now()}`, {
        cache: 'no-store',
      })
      const result = (await response.json()) as RulesApiResponse & {
        error?: string
      }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível carregar regras.')
      }
      setData(result)
      setDraft(result.rules)
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Erro ao carregar regras.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setData(initialData)
    setDraft(initialData.rules)
  }, [initialData])

  async function handleSave() {
    if (!data.editable) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/commercial-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshotToPatchBody(draft)),
      })
      const result = (await response.json()) as RulesApiResponse & {
        error?: string
      }
      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível salvar regras.')
      }
      setData((current) => ({
        ...current,
        rules: result.rules,
        editable: result.editable,
        table: result.table,
      }))
      setDraft(result.rules)
      setSuccess('Regras salvas com sucesso.')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Erro ao salvar regras.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-cdl-bg px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <AppMainNav />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-cdl-title sm:text-3xl">
              Regras comerciais
            </h1>
            <p className="mt-1 text-sm text-cdl-muted">
              Parâmetros de precificação e políticas da operação
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-cdl-border bg-cdl-surface px-5 py-3 text-sm font-bold uppercase tracking-wider text-cdl-fg disabled:opacity-50"
          >
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>

        <div className="rounded-2xl border border-cdl-border bg-cdl-surface p-4 sm:p-6">
          <p className="text-sm text-cdl-muted">
            Fonte:{' '}
            <span className="font-semibold text-cdl-fg">
              {draft.source === 'supabase'
                ? `Supabase (${data.table ?? 'commercial_rules'})`
                : 'Fallback (cdlCommercialRules.ts)'}
            </span>
          </p>
          {!data.editable ? (
            <p className="mt-2 text-sm text-cdl-warning">
              Edição indisponível — crie a tabela{' '}
              <code className="text-cdl-fg">commercial_rules</code> ou{' '}
              <code className="text-cdl-fg">pricing_rules</code> no Supabase para
              persistir alterações.
            </p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-cdl-action">{error}</p> : null}
          {success ? (
            <p className="mt-2 text-sm text-cdl-success">{success}</p>
          ) : null}
        </div>

        <section className="cdl-panel p-5 sm:p-7">
          <h2 className="cdl-section-title">Parâmetros numéricos</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="col-span-full flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                Base de milhagem
              </span>
              <input
                type="text"
                value={draft.mileageBaseLocation}
                disabled={!data.editable}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    mileageBaseLocation: e.target.value,
                  }))
                }
                className="rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border disabled:opacity-60"
              />
            </label>
            {NUMERIC_FIELDS.map(({ key, label, step }) => (
              <label key={key} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-cdl-muted">
                  {label}
                </span>
                <input
                  type="number"
                  step={step}
                  value={draft[key] as number}
                  disabled={!data.editable}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      [key]: Number(e.target.value),
                    }))
                  }
                  className="rounded-xl border border-cdl-border bg-cdl-inset px-3 py-2 text-sm text-cdl-fg outline-none focus:border-cdl-accent-border disabled:opacity-60"
                />
              </label>
            ))}
          </div>
          {data.editable ? (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="cdl-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar regras'}
              </button>
            </div>
          ) : null}
        </section>

        <section className="cdl-panel p-5 sm:p-7">
          <h2 className="cdl-section-title">Validade da cotação</h2>
          <p className="mt-2 text-sm text-cdl-muted">
            Validade padrão: {data.textRules.quoteValidityDays} dias (definida no
            salvamento da cotação).
          </p>
        </section>

        <section className="cdl-panel p-5 sm:p-7">
          <h2 className="cdl-section-title">Textos e políticas</h2>
          <p className="mt-2 text-sm text-cdl-muted">
            {data.textRules.reservationPayment}
          </p>
          <div className="mt-4 space-y-4">
            {(
              [
                ['Pedido mínimo', data.textRules.minimumOrder],
                ['Milhagem', data.textRules.mileage],
                ['Reserva', data.textRules.reservation],
                ['Cancelamento', data.textRules.cancellation],
                ['Dezembro / janeiro', data.textRules.decemberJanuary],
                ['Política de alimentos', data.textRules.foodPolicy],
                ['Atraso no pagamento', data.textRules.latePayment],
              ] as const
            ).map(([title, items]) => (
              <div key={title}>
                <h3 className="text-sm font-bold text-cdl-fg">{title}</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-cdl-muted">
                  {items.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs italic text-cdl-muted">
            Textos longos permanecem em cdlCommercialRules.ts até existir coluna
            dedicada no banco.
          </p>
        </section>
      </div>
    </main>
  )
}
