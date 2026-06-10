import { CDL_DEFAULT_COMPANY_ID } from '@/Lib/cdlCompany'
import type { CompanyRole } from './types'

/**
 * Active company ID for the current deployment/session.
 * Today: env-based (CDL pilot). Future: Supabase Auth membership.
 */
export function getActiveCompanyId(): string {
  return (
    process.env.NEXT_PUBLIC_CDL_COMPANY_ID?.trim() ||
    process.env.CDL_COMPANY_ID?.trim() ||
    CDL_DEFAULT_COMPANY_ID
  )
}

/**
 * Optional branch override via env (single-branch deployments).
 * Future: cookie/session from TenantProvider.
 */
export function getActiveBranchIdFromEnv(): string | null {
  return (
    process.env.NEXT_PUBLIC_CDL_BRANCH_ID?.trim() ||
    process.env.CDL_BRANCH_ID?.trim() ||
    null
  )
}

export function getActiveRoleFromEnv(): CompanyRole | null {
  const raw = process.env.NEXT_PUBLIC_CDL_USER_ROLE?.trim()
  if (!raw) return null
  return raw as CompanyRole
}
