'use client'

import type { PackageOptionQueryDebug } from '@/Lib/fetchPackageOptionGroups'
import {
  getDisplayableFixedPackageItems,
  getPackageItemLabel,
  getPackageItemsForPackage,
  getPackageSideItemLabel,
  getPackageSideItemsForPackage,
  isGarnishMisplacedPackageItem,
  type PackageItem,
  type PackageSideItem,
} from '@/Lib/packageConfiguration'
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
  error: {
    message?: string
    details?: string | null
    hint?: string | null
    code?: string | null
  } | null | undefined
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
  packageItems = [],
  packageSideItems = [],
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
  packageItems?: ReadonlyArray<PackageItem>
  packageSideItems?: ReadonlyArray<PackageSideItem>
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

  const allConfiguredItems = getPackageItemsForPackage(
    selectedPackage.id,
    packageItems,
  )
  const choiceContext = { optionGroups, optionGroupItems }
  const configuredItems = getDisplayableFixedPackageItems(
    selectedPackage.id,
    packageItems,
    choiceContext,
  )
  const excludedItems = allConfiguredItems.filter(
    (item) => !configuredItems.some((row) => row.id === item.id),
  )
  const configuredSides = getPackageSideItemsForPackage(
    selectedPackage.id,
    packageSideItems,
  )
  const packageHasSides =
    selectedPackage.package_key?.trim().endsWith('+') ?? false

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
        Debug configuração do pacote
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
          <span className="font-bold">Pacote:</span>{' '}
          {selectedPackage.package_key ?? '—'} ·{' '}
          {selectedPackage.label_pt ?? '—'}
        </p>
        <p>
          <span className="font-bold">package_id:</span> {selectedPackage.id}
        </p>
      </div>

      <div className="mt-4 rounded-lg bg-white/80 px-3 py-2 text-xs">
        <p className="font-bold">
          package_items (fixos exibidos): {configuredItems.length} / raw:{' '}
          {allConfiguredItems.length}
        </p>
        {configuredItems.length > 0 ? (
          <ul className="mt-1 space-y-0.5 text-neutral-700">
            {configuredItems.map((item) => (
              <li key={item.id}>
                · {getPackageItemLabel(item)} /{' '}
                {item.additional_item_id?.trim() || 'sem additional_item_id'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 font-semibold text-amber-800">
            Atenção: pacote ainda não possui itens fixos configurados.
          </p>
        )}
        {excludedItems.length > 0 ? (
          <ul className="mt-2 space-y-0.5 text-neutral-500">
            <li className="font-semibold text-neutral-600">
              Ocultos do card (guarnição/escolha/placeholder):
            </li>
            {excludedItems.map((item) => (
              <li key={item.id}>
                · {item.item_key} / {getPackageItemLabel(item)}
                {isGarnishMisplacedPackageItem(item) ? ' [guarnição]' : ''}
                {item.is_choice_placeholder ? ' [placeholder]' : ''}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs">
        <p className="font-bold">
          package_side_items: {configuredSides.length}
        </p>
        {configuredSides.length > 0 ? (
          <ul className="mt-1 space-y-0.5 text-neutral-700">
            {configuredSides.map((side) => (
              <li key={side.id}>
                · {getPackageSideItemLabel(side)} /{' '}
                {side.additional_item_id?.trim() || 'sem additional_item_id'}
              </li>
            ))}
          </ul>
        ) : packageHasSides ? (
          <p className="mt-1 font-semibold text-amber-800">
            Atenção: pacote com guarnições ainda não possui guarnições
            configuradas.
          </p>
        ) : (
          <p className="mt-1 text-neutral-600">Pacote sem guarnições (+).</p>
        )}
      </div>

      <div className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs">
        <p className="font-bold">
          option groups: {merged.length} (flat:{' '}
          {groupsForPackageInFlat.length})
        </p>
        {merged.length > 0 ? (
          <ul className="mt-1 space-y-2">
            {merged.map((group) => (
              <li key={group.id}>
                <p className="font-semibold">
                  {group.option_group_key} / {group.label_pt ?? '—'} /{' '}
                  {group.items.length} itens
                </p>
                <ul className="mt-0.5 space-y-0.5 text-neutral-700">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      · {item.option_item_key ?? '—'} / {item.label_pt ?? '—'}{' '}
                      /{' '}
                      {item.additional_item_id?.trim() ||
                        'sem additional_item_id'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-neutral-600">
            Nenhum grupo de escolha para este package_id.
          </p>
        )}
      </div>

      <div className="mt-3 space-y-1 font-mono text-xs">
        <p>
          <span className="font-bold">fetch grupos/opções:</span>{' '}
          {queryDebug
            ? `${queryDebug.groupsFetched} / ${queryDebug.itemsFetched}`
            : '—'}
        </p>
        <p>
          <span className="font-bold">flat groups (total):</span>{' '}
          {flatGroupsTotal ?? optionGroups.length}
        </p>
      </div>

      <QueryErrorBlock title="groupsError" error={queryDebug?.groupsError} />
      <QueryErrorBlock title="itemsError" error={queryDebug?.itemsError} />

      {zeroRowsWithoutError ? (
        <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
          Query de option groups executou sem erro, mas retornou 0 grupos.
        </p>
      ) : null}
    </div>
  )
}
