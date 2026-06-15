'use client'

import {
  getCommercialOptionGroupLabel,
  sortOptionGroupsForQuote,
} from '@/Lib/packageQuoteDisplay'
import { isRequiredOptionGroup, type PackageOptionGroup } from '@/Lib/packageOptionGroups'
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
  const activeGroups = sortOptionGroupsForQuote(optionGroups)

  if (activeGroups.length === 0) return null

  if (mode === 'summary') {
    const selectableGroups = activeGroups.filter(
      (group) => (group.items?.length ?? 0) > 0,
    )

    return (
      <div className="space-y-2">
        {selectableGroups.map((group) => {
          const selectedId = selections[group.id]?.trim()
          const item = group.items.find((row) => row.id === selectedId)
          if (!item) return null
          const label = item.label_pt?.trim() || item.option_item_key || '—'
          const groupLabel = getCommercialOptionGroupLabel(group)
          return (
            <p key={group.id} className="text-sm text-neutral-800">
              <span className="font-semibold text-neutral-900">{groupLabel}:</span>{' '}
              {label}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {activeGroups.map((group) => {
        const groupLabel = getCommercialOptionGroupLabel(group)
        const required = isRequiredOptionGroup(group)
        const selectedItemId = selections[group.id] ?? null
        const isPending = pendingGroupIds.includes(group.id)
        const items = group.items ?? []

        return (
          <div
            key={group.id}
            className={`rounded-xl border bg-white px-3 py-2.5 ${
              isPending ? 'border-red-300 bg-red-50/40' : 'border-neutral-200'
            }`}
          >
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-bold text-neutral-900">{groupLabel}</p>
              {required ? (
                <span className="text-[10px] font-medium text-neutral-500">
                  obrigatório
                </span>
              ) : null}
            </div>

            {isPending ? (
              <p className="mb-2 text-xs text-red-700">
                Escolha uma opção para continuar.
              </p>
            ) : null}

            {items.length === 0 ? (
              <p className="text-xs text-neutral-500">Opções indisponíveis.</p>
            ) : (
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label={groupLabel}
              >
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
                      className={`min-h-[2.5rem] rounded-lg border px-2 py-2 text-center text-xs font-semibold leading-tight transition sm:text-sm ${
                        active
                          ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-300'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-neutral-300 hover:bg-white'
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
