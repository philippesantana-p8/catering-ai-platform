'use client'

import {
  getOptionGroupTitle,
  getOptionItemLabel,
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
  const selectableGroups = optionGroups.filter((group) => group.items.length > 0)
  if (selectableGroups.length === 0) return null

  if (mode === 'summary') {
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
            return (
              <p key={group.id} className="text-sm text-neutral-800">
                <span className="font-bold text-neutral-900">
                  {getOptionGroupTitle(group, language)}:
                </span>{' '}
                {getOptionItemLabel(item, language)}
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
      {selectableGroups.map((group) => {
        const groupTitle = getOptionGroupTitle(group, language)
        const selectedItemId = selections[group.id] ?? null
        const isPending = pendingGroupIds.includes(group.id)

        return (
          <div
            key={group.id}
            className={`space-y-2 rounded-lg p-2 transition ${
              isPending ? 'bg-red-50 ring-2 ring-red-200' : ''
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-600">
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
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const active = selectedItemId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange?.(group.id, item.id)}
                    className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                      active
                        ? 'border-red-400 bg-gradient-to-br from-red-50 to-amber-50 text-red-900 shadow-sm ring-2 ring-amber-300'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-red-200 hover:bg-red-50/40'
                    }`}
                  >
                    {getOptionItemLabel(item, language)}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
