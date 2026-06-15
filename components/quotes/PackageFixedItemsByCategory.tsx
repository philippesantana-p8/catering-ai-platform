'use client'

import type { PackageItemCategoryGroup } from '@/Lib/packageQuoteDisplay'

export default function PackageFixedItemsByCategory({
  groups,
  compact = false,
}: {
  groups: ReadonlyArray<PackageItemCategoryGroup>
  compact?: boolean
}) {
  if (groups.length === 0) return null

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {groups.map((group) => (
        <div key={group.category}>
          <p
            className={
              compact
                ? 'text-xs font-bold uppercase tracking-wide text-neutral-700'
                : 'text-sm font-bold text-neutral-900'
            }
          >
            {group.label}
          </p>
          <ul className="mt-1.5 space-y-1">
            {group.items.map(({ label, item }) => (
              <li
                key={item.id}
                className={
                  compact
                    ? 'text-sm text-neutral-700'
                    : 'text-sm leading-relaxed text-neutral-700'
                }
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
