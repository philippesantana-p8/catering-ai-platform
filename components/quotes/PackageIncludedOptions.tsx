'use client'

import CatalogImageFrame from '@/components/CatalogImageFrame'
import {
  resolveCatalogItemImageForLink,
  type CatalogItemImageSource,
} from '@/Lib/catalogItemVisual'
import {
  getOptionGroupTitle,
  isRequiredOptionGroup,
  type PackageOptionGroup,
} from '@/Lib/packageOptionGroups'
import { sortOptionGroupsForQuote } from '@/Lib/packageQuoteDisplay'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

export default function PackageIncludedOptions({
  optionGroups,
  selections,
  onChange,
  language = 'pt',
  mode = 'select',
  pendingGroupIds = [],
  catalogItems = [],
}: {
  optionGroups: ReadonlyArray<PackageOptionGroup>
  selections: Record<string, string>
  onChange?: (groupId: string, itemId: string) => void
  language?: QuoteLanguage
  mode?: 'select' | 'summary'
  pendingGroupIds?: string[]
  catalogItems?: ReadonlyArray<CatalogItemImageSource & { id: string }>
}) {
  const activeGroups = sortOptionGroupsForQuote(optionGroups)

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
      <div className="space-y-3">
        <p className="text-sm font-bold text-neutral-900">Escolhas obrigatórias</p>
        <div className="space-y-3">
          {selectableGroups.map((group) => {
            const selectedId = selections[group.id]?.trim()
            const item = group.items.find((row) => row.id === selectedId)
            if (!item) return null
            const label = item.label_pt?.trim() || item.option_item_key || '—'
            const visual = resolveCatalogItemImageForLink(catalogItems, item)
            return (
              <div key={group.id} className="flex items-center gap-3">
                <CatalogImageFrame
                  src={visual.imageUrl}
                  alt={label}
                  variant="catalogItem"
                  itemType={visual.itemType ?? 'PRODUCT'}
                  categoryPt={visual.categoryPt}
                  imageStatus={visual.imageStatus}
                  size="thumbnail"
                  rounded="all"
                />
                <p className="text-sm text-neutral-800">
                  <span className="font-bold text-neutral-900">
                    {group.label_pt?.trim() || getOptionGroupTitle(group, language)}:
                  </span>{' '}
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-neutral-900">Escolhas obrigatórias</p>
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
                Escolha uma opção para continuar.
              </p>
            ) : null}
            {items.length === 0 ? (
              <p className="text-xs font-semibold text-red-700">
                Grupo encontrado, mas sem itens carregados.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={groupTitle}>
                {items.map((item) => {
                  const active = selectedItemId === item.id
                  const itemLabel =
                    item.label_pt?.trim() || item.option_item_key?.trim() || '—'
                  const visual = resolveCatalogItemImageForLink(catalogItems, item)
                  return (
                    <button
                      key={`${group.id}-${item.id}`}
                      type="button"
                      onClick={() => onChange?.(group.id, item.id)}
                      aria-pressed={active}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? 'border-red-400 bg-red-50 ring-2 ring-red-200'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <CatalogImageFrame
                        src={visual.imageUrl}
                        alt={itemLabel}
                        variant="catalogItem"
                        itemType={visual.itemType ?? 'PRODUCT'}
                        categoryPt={visual.categoryPt}
                        imageStatus={visual.imageStatus}
                        size="thumbnail"
                        rounded="all"
                        className="!h-12 !w-12 !min-h-0 !max-h-12 shrink-0"
                      />
                      <span className="text-sm font-semibold text-neutral-900">
                        {itemLabel}
                      </span>
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
