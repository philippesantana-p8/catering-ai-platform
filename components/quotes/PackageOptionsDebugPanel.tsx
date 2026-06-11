'use client'

import type {
  PackageOptionQueryDebug,
  PackageOptionQueryErrorInfo,
} from '@/Lib/fetchPackageOptionGroups'
import {
  mergeOptionGroupsForPackage,
  type PackageOptionGroupItem,
  type PackageOptionGroupRecord,
} from '@/Lib/packageOptionGroups'

function QueryErrorBlock({
  title,
  error,
}: {
  title: string
  error: PackageOptionQueryErrorInfo | null | undefined
}) {
  if (!error?.message) return null

  return (
    <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
      <p className="font-black uppercase tracking-wide">{title}</p>
      <p className="mt-1 font-mono">
        <span className="font-bold">message:</span> {error.message}
      </p>
      {error.details ? (
        <p className="mt-1 font-mono">
          <span className="font-bold">details:</span> {error.details}
        </p>
      ) : null}
      {error.hint ? (
        <p className="mt-1 font-mono">
          <span className="font-bold">hint:</span> {error.hint}
        </p>
      ) : null}
      {error.code ? (
        <p className="mt-1 font-mono">
          <span className="font-bold">code:</span> {error.code}
        </p>
      ) : null}
    </div>
  )
}

export default function PackageOptionsDebugPanel({
  companyId,
  selectedPackage,
  optionGroups,
  optionGroupItems,
  queryDebug,
  flatGroupsTotal,
}: {
  companyId: string
  selectedPackage: {
    id: string
    package_key?: string | null
    label_pt?: string | null
  } | null
  optionGroups: ReadonlyArray<PackageOptionGroupRecord>
  optionGroupItems: ReadonlyArray<PackageOptionGroupItem>
  queryDebug?: PackageOptionQueryDebug | null
  flatGroupsTotal?: number
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

  const groupsForPackageInFlat = optionGroups.filter(
    (group) => group.package_id?.trim() === selectedPackage.id.trim(),
  )

  const zeroRowsWithoutError =
    queryDebug?.groupsQueryRan === true &&
    queryDebug.groupsFetched === 0 &&
    !queryDebug.groupsError?.message

  return (
    <div className="mt-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-neutral-900">
      <p className="text-xs font-black uppercase tracking-wider text-amber-900">
        Debug escolhas do pacote
      </p>

      <div className="mt-3 space-y-1 font-mono text-xs">
        <p>
          <span className="font-bold">company_id (UI):</span> {companyId || '—'}
        </p>
        <p>
          <span className="font-bold">queryCompanyId:</span>{' '}
          {queryDebug?.queryCompanyId ?? '—'}
        </p>
        <p>
          <span className="font-bold">currentBranchId:</span>{' '}
          {queryDebug?.currentBranchId ?? '—'}
        </p>
        <p>
          <span className="font-bold">branch filter ativo:</span>{' '}
          {queryDebug?.branchFilterActive === true ? 'sim' : 'não'}
        </p>
        <p>
          <span className="font-bold">packageIds (array):</span>{' '}
          {queryDebug?.packageIds?.length
            ? `[${queryDebug.packageIdsCount ?? queryDebug.packageIds.length}] ${queryDebug.packageIds.join(', ')}`
            : '—'}
        </p>
        <p>
          <span className="font-bold">groups query ran:</span>{' '}
          {queryDebug?.groupsQueryRan === true ? 'sim' : 'não'}
        </p>
        <p>
          <span className="font-bold">items query ran:</span>{' '}
          {queryDebug?.itemsQueryRan === true ? 'sim' : 'não'}
        </p>
        <p>
          <span className="font-bold">fetch grupos/itens:</span>{' '}
          {queryDebug
            ? `${queryDebug.groupsFetched} / ${queryDebug.itemsFetched}`
            : '—'}
        </p>
        <p>
          <span className="font-bold">flat groups (total):</span>{' '}
          {flatGroupsTotal ?? optionGroups.length}
        </p>
        <p>
          <span className="font-bold">flat groups (este package_id):</span>{' '}
          {groupsForPackageInFlat.length}
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
          <span className="font-bold">Grupos (merge):</span> {merged.length}
        </p>
        <p>
          <span className="font-bold">Itens (total):</span>{' '}
          {itemsForPackage.length}
        </p>
      </div>

      <QueryErrorBlock title="groupsError" error={queryDebug?.groupsError} />
      <QueryErrorBlock title="itemsError" error={queryDebug?.itemsError} />

      {zeroRowsWithoutError ? (
        <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
          Query executou sem erro, mas retornou 0 grupos. Suspeitas: RLS
          bloqueando SELECT (anon key), schema cache, ou dados ausentes para
          company_id/package_id.
        </p>
      ) : null}

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
