import { getActiveCompanyId } from './resolveTenant'

type FilterableQuery = {
  eq: (column: string, value: string) => FilterableQuery
  is: (column: string, value: null) => FilterableQuery
  or: (filters: string) => FilterableQuery
}

/**
 * Restrict query to current company tenant.
 */
export function applyCompanyScope<T extends FilterableQuery>(
  query: T,
  companyId: string = getActiveCompanyId(),
): T {
  if (!companyId?.trim()) return query
  return query.eq('company_id', companyId) as T
}

/**
 * Catalog scope: company-wide rows (branch_id null) OR branch-specific rows.
 */
export function applyBranchCatalogScope<T extends FilterableQuery>(
  query: T,
  branchId: string | null | undefined,
  companyId: string = getActiveCompanyId(),
): T {
  let scoped = applyCompanyScope(query, companyId)
  if (!branchId?.trim()) {
    return scoped.is('branch_id', null) as T
  }
  return scoped.or(`branch_id.is.null,branch_id.eq.${branchId}`) as T
}

export function assertCompanyId(companyId?: string | null): string {
  const resolved = companyId?.trim() || getActiveCompanyId()
  if (!resolved) {
    throw new Error('company_id é obrigatório para esta operação.')
  }
  return resolved
}
