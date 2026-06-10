import PackagesDashboard from '@/components/PackagesDashboard'
import { fetchAdditionalItems } from '@/Lib/fetchAdditionalItems'
import { fetchPackages } from '@/Lib/fetchPackages'
import { loadPackageConfiguration } from '@/Lib/packageConfiguration'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PackagesPage() {
  const [packagesRes, additionalRes] = await Promise.all([
    fetchPackages({ includeInactive: false }),
    fetchAdditionalItems({ activeOnly: true }),
  ])

  const { data, error } = packagesRes

  if (error) {
    return (
      <main className="min-h-screen bg-cdl-bg px-4 py-8">
        <pre className="rounded-2xl border border-red-500/40 bg-cdl-surface p-4 text-sm text-red-400">
          {error.message}
        </pre>
      </main>
    )
  }

  const packages = data ?? []
  const packageConfigurationRes = await loadPackageConfiguration({
    packageIds: packages.map((pkg) => pkg.id),
  })

  const packageConfiguration = packageConfigurationRes.data ?? {
    packageItems: [],
    packageSideItems: [],
    optionGroups: [],
    optionGroupItems: [],
  }

  return (
    <PackagesDashboard
      initialPackages={packages}
      packageItems={packageConfiguration.packageItems}
      packageSideItems={packageConfiguration.packageSideItems}
      packageOptionGroups={packageConfiguration.optionGroups}
      packageOptionGroupItems={packageConfiguration.optionGroupItems}
      additionalItems={additionalRes.data ?? []}
    />
  )
}
