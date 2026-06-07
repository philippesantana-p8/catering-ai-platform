import {
  fetchActiveCustomers,
  type CustomerListItem,
} from '@/Lib/fetchCustomers'
import {
  customerMatchesSearch,
  dedupeCustomersList,
  sortCustomersByRecency,
} from '@/Lib/searchCustomers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''

  const { data, error } = await fetchActiveCustomers()

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? 'Não foi possível buscar clientes.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }

  let result = dedupeCustomersList(data)
  if (query) {
    result = dedupeCustomersList(
      sortCustomersByRecency(
        data.filter((customer) => customerMatchesSearch(customer, query)),
      ),
    )
  }

  return Response.json(
    { data: result },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}
