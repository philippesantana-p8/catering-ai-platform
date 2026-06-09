'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BackofficeCascadeLayout,
  BackofficeCascadePanel,
} from '@/components/backoffice/BackofficeSectionPrimitives'
import QuotePackageSummary from '@/components/quotes/QuotePackageSummary'
import { PackageCodeOption } from '@/components/premium/PremiumPrimitives'
import { sortPackagesByCommercialTier } from '@/Lib/packageDisplay'
import { getPackageHasGarnish } from '@/Lib/packageFieldAccess'
import type { PackageCatalogFields } from '@/Lib/packageCatalogVisual'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

type PackageRow = PackageCatalogFields & { id: string }
type GarnishGroup = 'with' | 'without'

function PackageGroupOption({
  title,
  count,
  badgeLabel,
  active,
  onClick,
}: {
  title: string
  count: number
  badgeLabel: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
        active
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-white ring-2 ring-red-100'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-neutral-900">{title}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {count} {count === 1 ? 'pacote' : 'pacotes'}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            badgeLabel === 'Com guarnições'
              ? 'bg-amber-50 text-amber-800'
              : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {badgeLabel}
        </span>
      </div>
    </button>
  )
}

function resolveGroupForPackage(
  pkg: PackageRow | null | undefined,
): GarnishGroup {
  if (!pkg) return 'with'
  return getPackageHasGarnish(pkg) ? 'with' : 'without'
}

export default function QuotePackageStepExplorer({
  packagesWithoutSides,
  packagesWithSides,
  allPackages,
  selectedPackageId,
  language = 'pt',
  sidesPricePerPerson = 13,
  onSelect,
}: {
  packagesWithoutSides: PackageRow[]
  packagesWithSides: PackageRow[]
  allPackages: PackageRow[]
  selectedPackageId: string | null
  language?: QuoteLanguage
  sidesPricePerPerson?: number
  onSelect: (id: string) => void
}) {
  const sortedWithSides = useMemo(
    () => sortPackagesByCommercialTier(packagesWithSides),
    [packagesWithSides],
  )

  const sortedWithoutSides = useMemo(
    () => sortPackagesByCommercialTier(packagesWithoutSides),
    [packagesWithoutSides],
  )

  const selectedPackage = useMemo(
    () => allPackages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [allPackages, selectedPackageId],
  )

  const [selectedGroup, setSelectedGroup] = useState<GarnishGroup>(() =>
    resolveGroupForPackage(
      allPackages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    ),
  )

  const [mobileExpandedGroup, setMobileExpandedGroup] =
    useState<GarnishGroup>('with')

  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(
    () => selectedPackageId,
  )

  useEffect(() => {
    if (!selectedPackage) return
    setSelectedGroup(resolveGroupForPackage(selectedPackage))
  }, [selectedPackage])

  useEffect(() => {
    if (!selectedPackageId) return
    setExpandedPackageId((prev) => prev ?? selectedPackageId)
  }, [selectedPackageId])

  const groupPackages =
    selectedGroup === 'with' ? sortedWithSides : sortedWithoutSides

  const groupTitle =
    selectedGroup === 'with' ? 'Com guarnições' : 'Sem guarnições'

  function selectGroup(group: GarnishGroup) {
    setSelectedGroup(group)
    setMobileExpandedGroup(group)

    const list = group === 'with' ? sortedWithSides : sortedWithoutSides
    const currentInGroup = list.find((pkg) => pkg.id === selectedPackageId)
    if (!currentInGroup && list.length > 0) {
      onSelect(list[0].id)
      setExpandedPackageId(list[0].id)
    }
  }

  function handlePackageClick(pkg: PackageRow) {
    onSelect(pkg.id)
    setExpandedPackageId((current) => (current === pkg.id ? null : pkg.id))
  }

  const totalCount = packagesWithoutSides.length + packagesWithSides.length

  if (totalCount === 0) {
    return (
      <p className="text-sm text-cdl-muted">Nenhum pacote disponível.</p>
    )
  }

  const packageList = (packages: PackageRow[]) => (
    <div className="space-y-3">
      {packages.map((pkg) => (
        <div key={pkg.id}>
          <PackageCodeOption
            pkg={pkg}
            active={selectedPackageId === pkg.id}
            onClick={() => handlePackageClick(pkg)}
          />
          {expandedPackageId === pkg.id ? (
            <div className="mt-3">
              <QuotePackageSummary
                pkg={pkg}
                allPackages={allPackages}
                language={language}
                sidesPricePerPerson={sidesPricePerPerson}
                selected={selectedPackageId === pkg.id}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )

  const mobileGroupSection = (
    group: GarnishGroup,
    title: string,
    badge: string,
    packages: PackageRow[],
  ) => {
    const expanded = mobileExpandedGroup === group
    return (
      <section
        key={group}
        className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl lg:hidden"
      >
        <button
          type="button"
          onClick={() => {
            selectGroup(group)
            setMobileExpandedGroup(group)
          }}
          className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-cdl-hover"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-lg font-extrabold text-cdl-title">{title}</span>
            <span className="text-sm text-cdl-muted">
              {packages.length}{' '}
              {packages.length === 1 ? 'pacote' : 'pacotes'}
            </span>
            <span className="rounded-full bg-cdl-inset px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cdl-muted">
              {badge}
            </span>
          </div>
          <span
            className={`shrink-0 text-sm text-cdl-accent transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>
        {expanded ? (
          <div className="border-t border-cdl-border-subtle p-4">
            {packageList(packages)}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <div className="space-y-3">
      {/* Desktop — 3 colunas sempre visíveis */}
      <div className="hidden lg:block">
        <BackofficeCascadeLayout>
          <BackofficeCascadePanel
            title="Tipo de pacote"
            subtitle="Com ou sem guarnições"
            className="lg:col-span-3"
          >
            <div className="space-y-3">
              {sortedWithSides.length > 0 ? (
                <PackageGroupOption
                  title="Com guarnições"
                  count={sortedWithSides.length}
                  badgeLabel="Com guarnições"
                  active={selectedGroup === 'with'}
                  onClick={() => selectGroup('with')}
                />
              ) : null}
              {sortedWithoutSides.length > 0 ? (
                <PackageGroupOption
                  title="Sem guarnições"
                  count={sortedWithoutSides.length}
                  badgeLabel="Sem guarnições"
                  active={selectedGroup === 'without'}
                  onClick={() => selectGroup('without')}
                />
              ) : null}
            </div>
          </BackofficeCascadePanel>

          <BackofficeCascadePanel
            title={groupTitle}
            subtitle={`${groupPackages.length} opções`}
            className="lg:col-span-3"
          >
            <div className="space-y-3">
              {groupPackages.map((pkg) => (
                <PackageCodeOption
                  key={pkg.id}
                  pkg={pkg}
                  active={selectedPackageId === pkg.id}
                  onClick={() => onSelect(pkg.id)}
                />
              ))}
            </div>
          </BackofficeCascadePanel>

          <div className="lg:col-span-6">
            {selectedPackage ? (
              <QuotePackageSummary
                pkg={selectedPackage}
                allPackages={allPackages}
                language={language}
                sidesPricePerPerson={sidesPricePerPerson}
                selected
              />
            ) : (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm">
                Selecione um pacote para ver os detalhes.
              </div>
            )}
          </div>
        </BackofficeCascadeLayout>
      </div>

      {/* Mobile — card inline abaixo do item clicado */}
      {sortedWithSides.length > 0
        ? mobileGroupSection(
            'with',
            'Com guarnições',
            'Com guarnições',
            sortedWithSides,
          )
        : null}
      {sortedWithoutSides.length > 0
        ? mobileGroupSection(
            'without',
            'Sem guarnições',
            'Sem guarnições',
            sortedWithoutSides,
          )
        : null}
    </div>
  )
}
