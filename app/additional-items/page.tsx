import AdditionalItemsDashboard from '@/components/AdditionalItemsDashboard'
import { fetchAdditionalItems } from '@/Lib/fetchAdditionalItems'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdditionalItemsPage() {
  const { data, error } = await fetchAdditionalItems({ includeInactive: false })

  if (error) {
    return (
      <main className="min-h-screen bg-cdl-bg px-4 py-8">
        <pre className="rounded-2xl border border-red-500/40 bg-cdl-surface p-4 text-sm text-red-400">
          {error.message}
        </pre>
      </main>
    )
  }

  return <AdditionalItemsDashboard initialItems={data ?? []} />
}
