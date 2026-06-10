import { fetchPackageItems } from '@/Lib/packageConfiguration'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const packageId = url.searchParams.get('package_id')

  const { data, error } = await fetchPackageItems({
    packageId,
  })

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? 'Não foi possível buscar itens do pacote.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return Response.json(
    { data },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
  )
}
