'use client'

import type { PackageSideItem } from '@/Lib/packageConfiguration'
import type { PackageOptionGroup } from '@/Lib/packageOptionGroups'
import { getQuoteDisplaySideLabels } from '@/Lib/packageQuoteDisplay'

function formatPortugueseList(labels: string[]): string {
  const items = labels.filter(Boolean)
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} e ${items[1]}`
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

function getSideChoiceLabels(
  optionGroups: ReadonlyArray<PackageOptionGroup>,
): string[] {
  const sideGroup = optionGroups.find(
    (group) =>
      group.option_group_key?.trim().toUpperCase() === 'SIDE_OPTION' &&
      group.active !== false,
  )
  if (!sideGroup?.items?.length) return []

  return sideGroup.items
    .map((item) => item.label_pt?.trim() || item.option_item_key?.trim() || '')
    .filter(Boolean)
}

export default function PackageIncludedSidesSummary({
  packageId,
  packageSideItems = [],
  optionGroups = [],
  language = 'pt',
}: {
  packageId: string
  packageSideItems?: ReadonlyArray<PackageSideItem>
  optionGroups?: ReadonlyArray<PackageOptionGroup>
  language?: 'pt' | 'en' | 'es'
}) {
  const fixedLabels = getQuoteDisplaySideLabels(packageId, packageSideItems, language)
  const choiceLabels = getSideChoiceLabels(optionGroups)

  if (fixedLabels.length === 0 && choiceLabels.length === 0) return null

  const choiceText =
    choiceLabels.length > 0
      ? choiceLabels.map((label) => label.toLowerCase()).join(' ou ')
      : null

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-sm text-neutral-700">
      <p className="font-semibold text-neutral-900">Guarnições inclusas:</p>
      {fixedLabels.length > 0 ? (
        <p className="mt-1">{formatPortugueseList(fixedLabels)}.</p>
      ) : null}
      {choiceText ? (
        <p className="mt-1">
          Escolha final:{' '}
          <span className="font-semibold text-[var(--brand-primary)]">
            {choiceText}
          </span>
          .
        </p>
      ) : null}
    </div>
  )
}
