import {
  loadPackageOptionChoices,
  toPackageOptionQueryError,
} from '@/Lib/fetchPackageOptionGroups'
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

  const branchId = url.searchParams.get('branch_id')

  const { groups, groupItems, error, queryDebug } = await loadPackageOptionChoices({
    packageId,
    packageIds,
    currentBranchId: branchId,
  })

  const merged = packageId?.trim()
    ? mergeOptionGroupsForPackage(packageId, groups, groupItems, {
        includeEmptyGroups: true,
      })
    : []

  const groupsError = queryDebug.groupsError ?? toPackageOptionQueryError(error)
  const responseBody = {
    companyId: getCdlCompanyId(),
    groups,
    groupItems,
    merged,
    queryDebug: {
      ...queryDebug,
      groupsError,
    },
    error: groupsError?.message ?? queryDebug.itemsError?.message ?? null,
  }

  if (error || groupsError || queryDebug.itemsError) {
    return Response.json(responseBody, {
      status: error || groupsError || queryDebug.itemsError ? 500 : 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return Response.json(responseBody, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}
