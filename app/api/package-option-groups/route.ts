import { fetchPackageOptionGroups } from '@/Lib/fetchPackageOptionGroups'
import { getCdlCompanyId } from '@/Lib/cdlCompany'
import { insertPackageOptionGroup } from '@/Lib/writePackageConfig'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const packageId = url.searchParams.get('package_id')
  const packageIdsParam = url.searchParams.get('package_ids')
  const packageIds = packageIdsParam
    ? packageIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
    : null
  const includeInactive = url.searchParams.get('active') === 'all'

  const { data, error } = await fetchPackageOptionGroups({
    packageId,
    packageIds,
    includeInactive,
  })

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? 'Não foi possível buscar grupos de opções.' },
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

  const { data, error } = await insertPackageOptionGroup(body)
  if (error) {
    return Response.json(
      { error: error.message ?? 'Não foi possível criar grupo.' },
      { status: 500 },
    )
  }
  return Response.json({ data }, { status: 201 })
}
