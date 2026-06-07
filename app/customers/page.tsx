import CustomersDashboard from '@/components/CustomersDashboard'
import { fetchActiveCustomers } from '@/Lib/fetchCustomers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomersPage() {
  const { data, error } = await fetchActiveCustomers()

  if (error) {
    return (
      <main className="min-h-screen bg-cdl-bg p-10 text-cdl-fg">
        <h1 className="text-2xl font-bold text-red-400">Erro</h1>
        <pre className="mt-4 rounded-3xl bg-cdl-surface p-4 text-sm text-red-400">
          {error.message}
        </pre>
      </main>
    )
  }

  return <CustomersDashboard initialCustomers={data ?? []} />
}
