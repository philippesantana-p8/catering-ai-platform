'use client'

import {
  mergeOptionGroupsForPackage,
  type PackageOptionGroupItem,
  type PackageOptionGroupRecord,
} from '@/Lib/packageOptionGroups'

export default function PackageOptionsDebugPanel({
  companyId,
  selectedPackage,
  optionGroups,
  optionGroupItems,
}: {
  companyId: string
  selectedPackage: {
    id: string
    package_key?: string | null
    label_pt?: string | null
  } | null
  optionGroups: ReadonlyArray<PackageOptionGroupRecord>
  optionGroupItems: ReadonlyArray<PackageOptionGroupItem>
}) {
  if (!selectedPackage) return null

  const merged = mergeOptionGroupsForPackage(
    selectedPackage.id,
    optionGroups,
    optionGroupItems,
    { includeEmptyGroups: true },
  )

  const itemsForPackage = optionGroupItems.filter((item) =>
    merged.some((group) => group.id === item.option_group_id?.trim()),
  )

  return (
    <div className="mt-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-neutral-900">
      <p className="text-xs font-black uppercase tracking-wider text-amber-900">
        Debug escolhas do pacote
      </p>

      <div className="mt-3 space-y-1 font-mono text-xs">
        <p>
          <span className="font-bold">company_id:</span> {companyId || '—'}
        </p>
        <p>
          <span className="font-bold">Pacote:</span>{' '}
          {selectedPackage.package_key ?? '—'} ·{' '}
          {selectedPackage.label_pt ?? '—'}
        </p>
        <p>
          <span className="font-bold">package_id:</span> {selectedPackage.id}
        </p>
        <p>
          <span className="font-bold">Grupos:</span> {merged.length}
        </p>
        <p>
          <span className="font-bold">Itens (total):</span>{' '}
          {itemsForPackage.length}
        </p>
      </div>

      {merged.length > 0 ? (
        <ul className="mt-3 space-y-2 text-xs">
          {merged.map((group) => (
            <li key={group.id} className="rounded-lg bg-white/80 px-3 py-2">
              <p className="font-bold">
                {group.option_group_key} / {group.label_pt ?? '—'} /{' '}
                {group.items.length} itens
              </p>
              <p className="font-mono text-[10px] text-neutral-500">
                group.id: {group.id}
              </p>
              {group.items.length === 0 ? (
                <p className="mt-1 font-semibold text-red-700">
                  Grupo encontrado, mas sem itens carregados.
                </p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-neutral-700">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      · {item.option_item_key ?? '—'} / {item.label_pt ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs font-semibold text-neutral-600">
          Nenhum grupo para este package_id.
        </p>
      )}
    </div>
  )
}
