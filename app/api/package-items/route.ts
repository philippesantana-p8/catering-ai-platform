import { fetchPackageItems } from '@/Lib/packageConfiguration'
import { insertPackageItem } from '@/Lib/writePackageConfig'
import { getCdlCompanyId } from '@/Lib/cdlCompany'

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

export async function POST(request: Request) {
  if (!getCdlCompanyId()?.trim()) {
    return Response.json({ error: 'company_id não configurado.' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const { data, error } = await insertPackageItem(body)
  if (error) {
    return Response.json(
      { error: error.message ?? 'Não foi possível criar item.' },
      { status: 500 },
    )
  }
  return Response.json({ data }, { status: 201 })
}
