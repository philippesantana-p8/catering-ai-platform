'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BackofficeCascadeLayout,
  BackofficeCascadeListButton,
  BackofficeCascadePanel,
} from '@/components/backoffice/BackofficeSectionPrimitives'
import QuotePackageSummary from '@/components/quotes/QuotePackageSummary'
import {
  PremiumChip,
  PremiumGroupBlock,
  SectionHeader,
} from '@/components/premium/PremiumPrimitives'
import { getPackageGroupSummaryCodes } from '@/Lib/packageDisplay'
import type { PackageCatalogFields } from '@/Lib/packageCatalogVisual'
import type { QuoteLanguage } from '@/Lib/quoteWizardTypes'

type PackageRow = PackageCatalogFields & { id: string }
type GarnishGroup = 'without' | 'with' | 'custom'
type MobileStep = 'groups' | 'codes' | 'detail'

export default function QuotePackageStepExplorer({
  packagesWithoutSides,
  packagesWithSides,
  customPackages,
  allPackages,
  selectedPackageId,
  language = 'pt',
  sidesPricePerPerson = 13,
  autoAdvanceOnSelect = false,
  onSelect,
  onSelectAndAdvance,
}: {
  packagesWithoutSides: PackageRow[]
  packagesWithSides: PackageRow[]
  customPackages: PackageRow[]
  allPackages: PackageRow[]
  selectedPackageId: string | null
  language?: QuoteLanguage
  sidesPricePerPerson?: number
  autoAdvanceOnSelect?: boolean
  onSelect: (id: string) => void
  onSelectAndAdvance: (id: string) => void
}) {
  const [selectedGroup, setSelectedGroup] = useState<GarnishGroup | null>(null)
  const [mobileStep, setMobileStep] = useState<MobileStep>('groups')

  const groupPackages = useMemo(() => {
    if (selectedGroup === 'with') return packagesWithSides
    if (selectedGroup === 'custom') return customPackages
    if (selectedGroup === 'without') return packagesWithoutSides
    return []
  }, [selectedGroup, packagesWithSides, packagesWithoutSides, customPackages])

  const selectedPackage = useMemo(
    () => allPackages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [allPackages, selectedPackageId],
  )

  useEffect(() => {
    if (!selectedGroup) {
      if (packagesWithoutSides.length > 0) setSelectedGroup('without')
      else if (packagesWithSides.length > 0) setSelectedGroup('with')
      else if (customPackages.length > 0) setSelectedGroup('custom')
    }
  }, [selectedGroup, packagesWithoutSides.length, packagesWithSides.length, customPackages.length])

  useEffect(() => {
    if (!selectedPackageId || !selectedPackage) return
    if (packagesWithSides.some((pkg) => pkg.id === selectedPackageId)) {
      setSelectedGroup('with')
    } else if (customPackages.some((pkg) => pkg.id === selectedPackageId)) {
      setSelectedGroup('custom')
    } else if (packagesWithoutSides.some((pkg) => pkg.id === selectedPackageId)) {
      setSelectedGroup('without')
    }
  }, [
    selectedPackageId,
    selectedPackage,
    packagesWithSides,
    packagesWithoutSides,
    customPackages,
  ])

  function selectGroup(group: GarnishGroup) {
    setSelectedGroup(group)
    setMobileStep('codes')
    const list =
      group === 'with'
        ? packagesWithSides
        : group === 'custom'
          ? customPackages
          : packagesWithoutSides
    const first = list[0]
    if (first) onSelect(first.id)
  }

  function selectPackage(id: string) {
    onSelect(id)
    setMobileStep('detail')
    if (autoAdvanceOnSelect) onSelectAndAdvance(id)
  }

  const showGroups = mobileStep === 'groups'
  const showCodes = mobileStep === 'codes'
  const showDetail = mobileStep === 'detail'

  const totalCount =
    packagesWithoutSides.length + packagesWithSides.length + customPackages.length

  if (totalCount === 0) {
    return (
      <p className="text-sm text-cdl-muted">Nenhum pacote disponível.</p>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Escolha o pacote"
        subtitle="Sem ou com guarnições → código → detalhe com foto e valores"
      />

      <BackofficeCascadeLayout>
        <div
          className={
            showGroups ? 'block lg:col-span-3' : 'hidden lg:block lg:col-span-3'
          }
        >
          <BackofficeCascadePanel title="Grupo" subtitle="Sem ou com guarnições">
            <div className="space-y-3">
              {packagesWithoutSides.length > 0 ? (
                <PremiumGroupBlock
                  title="Sem guarnições"
                  count={packagesWithoutSides.length}
                  summary={getPackageGroupSummaryCodes(packagesWithoutSides)}
                  active={selectedGroup === 'without'}
                  onClick={() => selectGroup('without')}
                />
              ) : null}
              {packagesWithSides.length > 0 ? (
                <PremiumGroupBlock
                  title="Com guarnições"
                  count={packagesWithSides.length}
                  summary={getPackageGroupSummaryCodes(packagesWithSides)}
                  active={selectedGroup === 'with'}
                  onClick={() => selectGroup('with')}
                />
              ) : null}
              {customPackages.length > 0 ? (
                <PremiumGroupBlock
                  title="Personalizado"
                  count={customPackages.length}
                  summary={getPackageGroupSummaryCodes(customPackages)}
                  active={selectedGroup === 'custom'}
                  onClick={() => selectGroup('custom')}
                />
              ) : null}
            </div>
          </BackofficeCascadePanel>
        </div>

        <div
          className={
            showCodes ? 'block lg:col-span-3' : 'hidden lg:block lg:col-span-3'
          }
        >
          <BackofficeCascadePanel
            title={
              selectedGroup === 'with'
                ? 'Com guarnições'
                : selectedGroup === 'custom'
                  ? 'Personalizado'
                  : 'Sem guarnições'
            }
            subtitle={`${groupPackages.length} códigos`}
            onBack={() => setMobileStep('groups')}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {groupPackages.map((pkg) => {
                const code = pkg.package_key ?? '—'
                const active = selectedPackageId === pkg.id
                const withGarnish = code.endsWith('+')
                return (
                  <PremiumChip
                    key={pkg.id}
                    active={active}
                    onClick={() => selectPackage(pkg.id)}
                    badge={
                      withGarnish ? (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          + guarnições
                        </span>
                      ) : undefined
                    }
                  >
                    {code}
                  </PremiumChip>
                )
              })}
            </div>
            <div className="space-y-2">
              {groupPackages.map((pkg) => (
                <BackofficeCascadeListButton
                  key={pkg.id}
                  active={selectedPackageId === pkg.id}
                  onClick={() => selectPackage(pkg.id)}
                >
                  <span>{pkg.package_key}</span>
                </BackofficeCascadeListButton>
              ))}
            </div>
          </BackofficeCascadePanel>
        </div>

        <div
          className={
            showDetail ? 'block lg:col-span-6' : 'hidden lg:block lg:col-span-6'
          }
        >
          {selectedPackage ? (
            <div>
              <button
                type="button"
                onClick={() => setMobileStep('codes')}
                className="mb-3 text-xs font-bold uppercase tracking-wider text-red-600 lg:hidden"
              >
                ← Voltar aos códigos
              </button>
              <QuotePackageSummary
                pkg={selectedPackage}
                allPackages={allPackages}
                language={language}
                sidesPricePerPerson={sidesPricePerPerson}
                selected={selectedPackageId === selectedPackage.id}
                onSelect={() => onSelect(selectedPackage.id)}
                onSelectAndAdvance={() => onSelectAndAdvance(selectedPackage.id)}
                showActions={!autoAdvanceOnSelect}
              />
            </div>
          ) : (
            <BackofficeCascadePanel
              title="Detalhe do pacote"
              subtitle="Selecione um código"
              className="!col-span-full"
              onBack={() => setMobileStep('codes')}
            >
              <p className="text-sm text-neutral-500">
                Escolha um grupo e um código para ver foto, itens e valores.
              </p>
            </BackofficeCascadePanel>
          )}
        </div>
      </BackofficeCascadeLayout>
    </div>
  )
}
