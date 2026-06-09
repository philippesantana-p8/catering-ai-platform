'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BackofficeCascadeLayout,
  BackofficeCascadePanel,
} from '@/components/backoffice/BackofficeSectionPrimitives'
import QuotePackageSummary from '@/components/quotes/QuotePackageSummary'
import {
  PackageCodeOption,
  PremiumGroupBlock,
  SectionHeader,
} from '@/components/premium/PremiumPrimitives'
import {
  getPackageGroupSummaryCodes,
  sortPackagesByCommercialTier,
} from '@/Lib/packageDisplay'
import { getPackageHasGarnish } from '@/Lib/packageFieldAccess'
import type { PackageCatalogFields } from '@/Lib/packageCatalogVisual'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

type PackageRow = PackageCatalogFields & { id: string }
type GarnishGroup = 'with' | 'without'
type MobilePanel = 'groups' | 'codes' | 'detail'

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
  const [selectedGroup, setSelectedGroup] = useState<GarnishGroup | null>(() => {
    if (!selectedPackageId) return null
    const pkg = allPackages.find((row) => row.id === selectedPackageId)
    if (!pkg) return null
    return getPackageHasGarnish(pkg) ? 'with' : 'without'
  })
  const [showPackageDetail, setShowPackageDetail] = useState(
    () => Boolean(selectedPackageId),
  )
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(() =>
    selectedPackageId ? 'detail' : 'groups',
  )

  const sortedWithSides = useMemo(
    () => sortPackagesByCommercialTier(packagesWithSides),
    [packagesWithSides],
  )

  const sortedWithoutSides = useMemo(
    () => sortPackagesByCommercialTier(packagesWithoutSides),
    [packagesWithoutSides],
  )

  const groupPackages = useMemo(() => {
    if (selectedGroup === 'with') return sortedWithSides
    if (selectedGroup === 'without') return sortedWithoutSides
    return []
  }, [selectedGroup, sortedWithSides, sortedWithoutSides])

  const selectedPackage = useMemo(
    () => allPackages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [allPackages, selectedPackageId],
  )

  useEffect(() => {
    if (!selectedPackageId || !selectedPackage) return
    setSelectedGroup(getPackageHasGarnish(selectedPackage) ? 'with' : 'without')
  }, [selectedPackageId, selectedPackage])

  function selectGroup(group: GarnishGroup) {
    setSelectedGroup(group)
    setShowPackageDetail(false)
    setMobilePanel('codes')
  }

  function selectPackage(id: string) {
    onSelect(id)
    setShowPackageDetail(true)
    setMobilePanel('detail')
  }

  function backFromDetail() {
    setShowPackageDetail(false)
    setMobilePanel('codes')
  }

  function backFromCodes() {
    setShowPackageDetail(false)
    setMobilePanel('groups')
  }

  const showGroupsMobile = mobilePanel === 'groups'
  const showCodesMobile = mobilePanel === 'codes'
  const showDetailMobile = mobilePanel === 'detail' && showPackageDetail

  const showGroupsDesktop = true
  const showCodesDesktop = Boolean(selectedGroup)
  const showDetailDesktop = showPackageDetail && Boolean(selectedPackage)

  const totalCount = packagesWithoutSides.length + packagesWithSides.length

  if (totalCount === 0) {
    return (
      <p className="text-sm text-cdl-muted">Nenhum pacote disponível.</p>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Choose your package"
        subtitle="Select the group, choose the code, and confirm the package details before continuing."
      />

      <BackofficeCascadeLayout>
        <div
          className={
            showGroupsMobile
              ? 'block lg:col-span-3'
              : 'hidden lg:block lg:col-span-3'
          }
        >
          <BackofficeCascadePanel
            title="Package group"
            subtitle="With or without side dishes"
          >
            <div className="space-y-3">
              {sortedWithSides.length > 0 ? (
                <PremiumGroupBlock
                  title="With side dishes"
                  count={sortedWithSides.length}
                  summary={getPackageGroupSummaryCodes(sortedWithSides)}
                  active={selectedGroup === 'with'}
                  onClick={() => selectGroup('with')}
                />
              ) : null}
              {sortedWithoutSides.length > 0 ? (
                <PremiumGroupBlock
                  title="Without side dishes"
                  count={sortedWithoutSides.length}
                  summary={getPackageGroupSummaryCodes(sortedWithoutSides)}
                  active={selectedGroup === 'without'}
                  onClick={() => selectGroup('without')}
                />
              ) : null}
            </div>
          </BackofficeCascadePanel>
        </div>

        <div
          className={
            showCodesMobile
              ? 'block lg:col-span-3'
              : showCodesDesktop
                ? 'hidden lg:block lg:col-span-3'
                : 'hidden'
          }
        >
          <BackofficeCascadePanel
            title={
              selectedGroup === 'with'
                ? 'With side dishes'
                : 'Without side dishes'
            }
            subtitle={`${groupPackages.length} packages`}
            onBack={backFromCodes}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {groupPackages.map((pkg) => (
                <PackageCodeOption
                  key={pkg.id}
                  pkg={pkg}
                  active={selectedPackageId === pkg.id}
                  onClick={() => selectPackage(pkg.id)}
                />
              ))}
            </div>
          </BackofficeCascadePanel>
        </div>

        <div
          className={
            showDetailMobile
              ? 'block lg:col-span-6'
              : showDetailDesktop
                ? 'hidden lg:block lg:col-span-6'
                : 'hidden'
          }
        >
          {selectedPackage && showPackageDetail ? (
            <div>
              <button
                type="button"
                onClick={backFromDetail}
                className="mb-3 text-xs font-bold uppercase tracking-wider text-red-600 lg:hidden"
              >
                ← Back to codes
              </button>
              <QuotePackageSummary
                pkg={selectedPackage}
                allPackages={allPackages}
                language={language}
                sidesPricePerPerson={sidesPricePerPerson}
                selected={selectedPackageId === selectedPackage.id}
                layout="split"
                englishLabels
              />
            </div>
          ) : (
            <BackofficeCascadePanel
              title="Package details"
              subtitle="Select a package code"
              className="!col-span-full hidden lg:block"
            >
              <p className="text-sm text-neutral-500">
                Choose a group and a package code to see the full details.
              </p>
            </BackofficeCascadePanel>
          )}
        </div>
      </BackofficeCascadeLayout>
    </div>
  )
}
