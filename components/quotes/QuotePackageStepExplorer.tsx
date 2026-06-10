'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import {
  BackofficeCascadeLayout,
  BackofficeCascadePanel,
} from '@/components/backoffice/BackofficeSectionPrimitives'
import QuotePackageSummary from '@/components/quotes/QuotePackageSummary'
import { PackageCodeOption } from '@/components/premium/PremiumPrimitives'
import { sortPackagesByCommercialTier } from '@/Lib/packageDisplay'
import { getPackageHasGarnish, getPackageKey } from '@/Lib/packageFieldAccess'
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

function MobileGroupButton({
  title,
  count,
  badge,
  active,
  expanded,
  onClick,
}: {
  title: string
  count: number
  badge: string
  active: boolean
  expanded: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 p-5 text-left transition-colors ${
        active ? 'bg-cdl-hover/60' : 'hover:bg-cdl-hover'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-lg font-extrabold text-cdl-title">{title}</span>
        <span className="text-sm text-cdl-muted">
          {count} {count === 1 ? 'pacote' : 'pacotes'}
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
  )
}

function MobilePackageList({
  packages,
  selectedPackageId,
  expandedPackageCode,
  allPackages,
  language,
  sidesPricePerPerson,
  packageDetailRefs,
  onPackageClick,
}: {
  packages: PackageRow[]
  selectedPackageId: string | null
  expandedPackageCode: string | null
  allPackages: PackageRow[]
  language: QuoteLanguage
  sidesPricePerPerson: number
  packageDetailRefs: MutableRefObject<Record<string, HTMLDivElement | null>>
  onPackageClick: (pkg: PackageRow) => void
}) {
  return (
    <div className="space-y-3 border-t border-cdl-border-subtle p-4">
      {packages.map((pkg) => {
        const code = getPackageKey(pkg)
        const isSelected = selectedPackageId === pkg.id
        const isExpanded = expandedPackageCode === code

        return (
          <div key={pkg.id}>
            <PackageCodeOption
              pkg={pkg}
              active={isSelected}
              onClick={() => onPackageClick(pkg)}
            />
            {isExpanded ? (
              <div
                ref={(el) => {
                  packageDetailRefs.current[code] = el
                }}
                className="package-detail-card mt-2 md:hidden"
              >
                <QuotePackageSummary
                  pkg={pkg}
                  allPackages={allPackages}
                  language={language}
                  sidesPricePerPerson={sidesPricePerPerson}
                  selected={isSelected}
                  compact
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
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
  onSelect: (id: string | null) => void
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
    selectedPackage
      ? resolveGroupForPackage(selectedPackage)
      : 'with',
  )

  const [mobileExpandedGroup, setMobileExpandedGroup] =
    useState<GarnishGroup | null>(null)

  const [expandedPackageCode, setExpandedPackageCode] = useState<string | null>(
    null,
  )

  const packageDetailRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!selectedPackage) return
    setSelectedGroup(resolveGroupForPackage(selectedPackage))
  }, [selectedPackage])

  const groupPackages =
    selectedGroup === 'with' ? sortedWithSides : sortedWithoutSides

  const groupTitle =
    selectedGroup === 'with' ? 'Com guarnições' : 'Sem guarnições'

  function selectGroupDesktop(group: GarnishGroup) {
    setSelectedGroup(group)
    const list = group === 'with' ? sortedWithSides : sortedWithoutSides
    const currentInGroup = list.find((pkg) => pkg.id === selectedPackageId)
    if (!currentInGroup && list.length > 0 && selectedPackageId) {
      onSelect(list[0].id)
    }
  }

  function openMobileGroup(group: GarnishGroup) {
    if (mobileExpandedGroup === group) {
      setMobileExpandedGroup(null)
      return
    }
    setMobileExpandedGroup(group)
    setSelectedGroup(group)
    onSelect(null)
    setExpandedPackageCode(null)
  }

  function handleMobilePackageClick(pkg: PackageRow) {
    const code = getPackageKey(pkg)
    const isExpanding = expandedPackageCode !== code

    onSelect(pkg.id)
    setExpandedPackageCode(code)

    if (isExpanding) {
      setTimeout(() => {
        packageDetailRefs.current[code]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 120)
    }
  }

  const totalCount = packagesWithoutSides.length + packagesWithSides.length

  if (totalCount === 0) {
    return (
      <p className="text-sm text-cdl-muted">Nenhum pacote disponível.</p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Desktop — 3 colunas */}
      <div className="hidden md:block">
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
                  onClick={() => selectGroupDesktop('with')}
                />
              ) : null}
              {sortedWithoutSides.length > 0 ? (
                <PackageGroupOption
                  title="Sem guarnições"
                  count={sortedWithoutSides.length}
                  badgeLabel="Sem guarnições"
                  active={selectedGroup === 'without'}
                  onClick={() => selectGroupDesktop('without')}
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

      {/* Mobile — grupos primeiro, pacotes só após escolher grupo */}
      <div className="space-y-3 md:hidden">
        {sortedWithSides.length > 0 ? (
          <section className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
            <MobileGroupButton
              title="Com guarnições"
              count={sortedWithSides.length}
              badge="Com guarnições"
              active={mobileExpandedGroup === 'with'}
              expanded={mobileExpandedGroup === 'with'}
              onClick={() => openMobileGroup('with')}
            />
            {mobileExpandedGroup === 'with' ? (
              <MobilePackageList
                packages={sortedWithSides}
                selectedPackageId={selectedPackageId}
                expandedPackageCode={expandedPackageCode}
                allPackages={allPackages}
                language={language}
                sidesPricePerPerson={sidesPricePerPerson}
                packageDetailRefs={packageDetailRefs}
                onPackageClick={handleMobilePackageClick}
              />
            ) : null}
          </section>
        ) : null}

        {sortedWithoutSides.length > 0 ? (
          <section className="overflow-hidden rounded-2xl border border-cdl-border bg-cdl-surface shadow-cdl">
            <MobileGroupButton
              title="Sem guarnições"
              count={sortedWithoutSides.length}
              badge="Sem guarnições"
              active={mobileExpandedGroup === 'without'}
              expanded={mobileExpandedGroup === 'without'}
              onClick={() => openMobileGroup('without')}
            />
            {mobileExpandedGroup === 'without' ? (
              <MobilePackageList
                packages={sortedWithoutSides}
                selectedPackageId={selectedPackageId}
                expandedPackageCode={expandedPackageCode}
                allPackages={allPackages}
                language={language}
                sidesPricePerPerson={sidesPricePerPerson}
                packageDetailRefs={packageDetailRefs}
                onPackageClick={handleMobilePackageClick}
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
