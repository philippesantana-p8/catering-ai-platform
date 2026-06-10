import { loadPackageOptionChoices } from '@/Lib/fetchPackageOptionGroups'
import { getCdlCompanyId } from '@/Lib/cdlCompany'
import { mergeOptionGroupsForPackage } from '@/Lib/packageOptionGroups'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url)
  const packageId = url.searchParams.get('package_id')
  const packageIdsParam = url.searchParams.get('package_ids')
  const packageIds = packageIdsParam
    ? packageIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
    : null

  const { groups, groupItems, error } = await loadPackageOptionChoices({
    packageId,
    packageIds,
  })

  if (error) {
    return Response.json(
      { error: error.message ?? 'Não foi possível buscar escolhas do pacote.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const merged = packageId?.trim()
    ? mergeOptionGroupsForPackage(packageId, groups, groupItems, {
        includeEmptyGroups: true,
      })
    : []

  return Response.json(
    {
      companyId: getCdlCompanyId(),
      groups,
      groupItems,
      merged,
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
  )
}
