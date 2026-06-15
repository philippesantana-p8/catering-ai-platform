'use client'

import {
  formatPackageInventoryList,
  type PackageSideItem,
} from '@/Lib/packageConfiguration'
import {
  getQuoteDisplaySideLabels,
} from '@/Lib/packageQuoteDisplay'

export default function PackageIncludedSidesSummary({
  packageId,
  packageSideItems = [],
  language = 'pt',
}: {
  packageId: string
  packageSideItems?: ReadonlyArray<PackageSideItem>
  language?: 'pt' | 'en' | 'es'
}) {
  const labels = getQuoteDisplaySideLabels(packageId, packageSideItems, language)
  if (labels.length === 0) return null

  return (
    <p className="text-sm text-neutral-600">
      <span className="font-semibold text-neutral-800">Guarnições inclusas:</span>{' '}
      {formatPackageInventoryList(labels)}
    </p>
  )
}
