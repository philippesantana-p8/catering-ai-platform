'use client'

import { useEffect, useMemo, useState } from 'react'
import QuotePackageSummary from '@/components/quotes/QuotePackageSummary'
import { PackageCodeOption } from '@/components/premium/PremiumPrimitives'
import { sortPackagesByCommercialTier } from '@/Lib/packageDisplay'
import { getPackageHasGarnish } from '@/Lib/packageFieldAccess'
import type { PackageCatalogFields } from '@/Lib/packageCatalogVisual'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

type PackageRow = PackageCatalogFields & { id: string }
type GarnishGroup = 'with' | 'without'

function PackageGroupSection({
  title,
  badgeLabel,
  packages,
  expanded,
  selectedPackageId,
  allPackages,
  language,
  sidesPricePerPerson,
  onToggle,
  onSelectPackage,
}: {
  title: string
  badgeLabel: string
  packages: PackageRow[]
  expanded: boolean
  selectedPackageId: string | null
  allPackages: PackageRow[]
  language: QuoteLanguage
  sidesPricePerPerson: number
  onToggle: () => void
  onSelectPackage: (id: string) => void
}) {
  const selectedInGroup = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  )

  return (
    <section className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-cdl-hover sm:p-6"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-lg font-extrabold text-cdl-title sm:text-xl">
            {title}
          </span>
          <span className="text-sm text-cdl-muted">
            {packages.length}{' '}
            {packages.length === 1 ? 'pacote' : 'pacotes'}
          </span>
          <span className="rounded-full bg-cdl-inset px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cdl-muted">
            {badgeLabel}
          </span>
        </div>
        <span
          className={`shrink-0 text-sm text-cdl-accent transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {expanded ? (
        <div className="space-y-5 border-t border-cdl-border-subtle p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCodeOption
                key={pkg.id}
                pkg={pkg}
                active={selectedPackageId === pkg.id}
                onClick={() => onSelectPackage(pkg.id)}
              />
            ))}
          </div>

          {selectedInGroup ? (
            <QuotePackageSummary
              pkg={selectedInGroup}
              allPackages={allPackages}
              language={language}
              sidesPricePerPerson={sidesPricePerPerson}
              selected
              layout="stacked"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  )
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

  const [expandedGroup, setExpandedGroup] = useState<GarnishGroup | null>(() => {
    if (!selectedPackageId) return null
    const pkg = allPackages.find((row) => row.id === selectedPackageId)
    if (!pkg) return null
    return getPackageHasGarnish(pkg) ? 'with' : 'without'
  })

  useEffect(() => {
    if (!selectedPackageId) return
    const pkg = allPackages.find((row) => row.id === selectedPackageId)
    if (!pkg) return
    setExpandedGroup(getPackageHasGarnish(pkg) ? 'with' : 'without')
  }, [selectedPackageId, allPackages])

  function toggleGroup(group: GarnishGroup) {
    setExpandedGroup((current) => (current === group ? null : group))
  }

  function selectPackage(id: string, group: GarnishGroup) {
    onSelect(id)
    setExpandedGroup(group)
  }

  const totalCount = packagesWithoutSides.length + packagesWithSides.length

  if (totalCount === 0) {
    return (
      <p className="text-sm text-cdl-muted">Nenhum pacote disponível.</p>
    )
  }

  return (
    <div className="space-y-3">
      {sortedWithSides.length > 0 ? (
        <PackageGroupSection
          title="Com guarnições"
          badgeLabel="Com guarnições"
          packages={sortedWithSides}
          expanded={expandedGroup === 'with'}
          selectedPackageId={selectedPackageId}
          allPackages={allPackages}
          language={language}
          sidesPricePerPerson={sidesPricePerPerson}
          onToggle={() => toggleGroup('with')}
          onSelectPackage={(id) => selectPackage(id, 'with')}
        />
      ) : null}

      {sortedWithoutSides.length > 0 ? (
        <PackageGroupSection
          title="Sem guarnições"
          badgeLabel="Sem guarnições"
          packages={sortedWithoutSides}
          expanded={expandedGroup === 'without'}
          selectedPackageId={selectedPackageId}
          allPackages={allPackages}
          language={language}
          sidesPricePerPerson={sidesPricePerPerson}
          onToggle={() => toggleGroup('without')}
          onSelectPackage={(id) => selectPackage(id, 'without')}
        />
      ) : null}
    </div>
  )
}
