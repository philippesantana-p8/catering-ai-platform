'use client'

import {
  getOptionGroupTitle,
  isRequiredOptionGroup,
  type PackageOptionGroup,
} from '@/Lib/packageOptionGroups'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

export default function PackageIncludedOptions({
  optionGroups,
  selections,
  onChange,
  language = 'pt',
  mode = 'select',
  pendingGroupIds = [],
}: {
  optionGroups: ReadonlyArray<PackageOptionGroup>
  selections: Record<string, string>
  onChange?: (groupId: string, itemId: string) => void
  language?: QuoteLanguage
  mode?: 'select' | 'summary'
  pendingGroupIds?: string[]
}) {
  const activeGroups = optionGroups.filter((group) => group.active !== false)

  if (activeGroups.length === 0) return null

  if (mode === 'summary') {
    const selectableGroups = activeGroups.filter(
      (group) => (group.items?.length ?? 0) > 0,
    )
    const missingRequired = selectableGroups.some(
      (group) =>
        isRequiredOptionGroup(group) && !selections[group.id]?.trim(),
    )

    if (missingRequired) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <p className="text-sm font-bold text-amber-950">Escolhas inclusas</p>
          <p className="mt-1 text-sm text-amber-900/90">
            Selecione as opções obrigatórias para concluir o pacote.
          </p>
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50/60 to-amber-50/30 p-4">
        <p className="text-sm font-bold text-neutral-900">Escolhas inclusas</p>
        <div className="mt-2 space-y-1.5">
          {selectableGroups.map((group) => {
            const selectedId = selections[group.id]?.trim()
            const item = group.items.find((row) => row.id === selectedId)
            if (!item) return null
            const label = item.label_pt?.trim() || item.option_item_key || '—'
            return (
              <p key={group.id} className="text-sm text-neutral-800">
                <span className="font-bold text-neutral-900">
                  {group.label_pt?.trim() || getOptionGroupTitle(group, language)}:
                </span>{' '}
                {label}
              </p>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-red-100 bg-gradient-to-br from-red-50/80 to-amber-50/40 p-4">
      <p className="text-sm font-bold text-neutral-900">
        Escolhas inclusas no pacote
      </p>
      {activeGroups.map((group) => {
        const groupTitle =
          group.label_pt?.trim() || getOptionGroupTitle(group, language)
        const selectedItemId = selections[group.id] ?? null
        const isPending = pendingGroupIds.includes(group.id)
        const items = group.items ?? []

        return (
          <div
            key={group.id}
            className={`space-y-2 rounded-lg p-2 transition ${
              isPending ? 'bg-red-50 ring-2 ring-red-200' : ''
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-800">
              {groupTitle}
              {isRequiredOptionGroup(group) ? (
                <span className="ml-1 text-red-600">*</span>
              ) : null}
            </p>
            {isPending ? (
              <p className="text-xs font-semibold text-red-700">
                Escolha uma opção em: {groupTitle}.
              </p>
            ) : null}
            {items.length === 0 ? (
              <p className="text-xs font-semibold text-red-700">
                Grupo encontrado, mas sem itens carregados.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2" role="group" aria-label={groupTitle}>
                {items.map((item) => {
                  const active = selectedItemId === item.id
                  const itemLabel =
                    item.label_pt?.trim() || item.option_item_key?.trim() || '—'
                  return (
                    <button
                      key={`${group.id}-${item.id}`}
                      type="button"
                      onClick={() => onChange?.(group.id, item.id)}
                      aria-pressed={active}
                      className={`package-option-choice ${
                        active ? 'selected' : ''
                      }`}
                    >
                      {itemLabel}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
